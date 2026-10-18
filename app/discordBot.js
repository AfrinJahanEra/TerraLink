import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { ChannelType, Client, EmbedBuilder, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js'

/**
 * TerraLink Discord bot, started with the dev server (`npm run dev`).
 * - One post (thread) per water body in a Discord forum channel, created on first start.
 * - Watches local-data/workspace.json and posts in a lake's thread whenever its status, reports,
 *   measurements, decisions or tasks change.
 * - `/status [lake]` shows the current state of one lake, or a summary of all of them.
 * Lake status comes from src/utils/siteState.js, the same code the web app uses.
 * Needs DISCORD_TOKEN, DISCORD_APP_ID, DISCORD_GUILD_ID and DISCORD_FORUM_CHANNEL_ID in .env.
 */

const DATA_DIR = path.resolve(process.cwd(), 'local-data')
const WORKSPACE_FILE = path.join(DATA_DIR, 'workspace.json')
const THREADS_FILE = path.join(DATA_DIR, 'discord-threads.json')
const POLL_MS = 2000
const log = (...args) => console.log('[discord]', ...args)

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

const statusCommand = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Current status of a water body, or of all of them')
  .addStringOption((option) => option.setName('lake').setDescription('Water body').setAutocomplete(true))

async function start(env, loadModule) {
  const { DISCORD_TOKEN: token, DISCORD_APP_ID: appId, DISCORD_GUILD_ID: guildId, DISCORD_FORUM_CHANNEL_ID: forumId } = env
  const appUrl = (env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

  // App code, loaded through Vite so its imports resolve exactly as in the browser.
  const [state, statusConstants, reportConstants, observationConstants, observations, budget, currency] = await Promise.all([
    loadModule('/src/utils/siteState.js'),
    loadModule('/src/constants/status.js'),
    loadModule('/src/constants/reports.js'),
    loadModule('/src/constants/observations.js'),
    loadModule('/src/utils/observations.js'),
    loadModule('/src/utils/budget.js'),
    loadModule('/src/utils/currency.js'),
  ])
  const { SITE_STATUS, TASK_STATUS, isTaskClosed } = statusConstants
  const { REPORT_CATEGORIES, REPORT_STATUS } = reportConstants
  const { VERDICT } = observationConstants
  const { formatAcquired, formatSignedHa } = observations
  const { formatBdt } = currency

  /** The saved workspace, derived the same way the app does. Null until the app has saved once. */
  function readState() {
    const saved = readJson(WORKSPACE_FILE, null)
    if (!saved?.data) return null
    const workspace = saved.data
    const derived = state.deriveWorkspace(workspace)
    const budgets = budget.buildSiteBudgetRows(derived.sites, derived.tasks, workspace.siteBudgets ?? {}, workspace.expenses ?? [])
    return { rev: saved.rev, workspace, ...derived, budgets }
  }

  /** What is worth announcing for each lake, so two reads can be compared. */
  function snapshot(current) {
    return Object.fromEntries(current.sites.map((site) => [site.id, {
      status: site.status,
      comparisonId: site.measured?.id ?? null,
      decisionAt: current.workspace.decisions?.[site.id]?.decidedAt ?? null,
      reports: Object.fromEntries(current.communityReports.filter((report) => report.siteId === site.id).map((report) => [report.id, report.status])),
      tasks: Object.fromEntries(current.tasks.filter((task) => task.siteId === site.id).map((task) => [task.id, task.status])),
    }]))
  }

  const statusLabel = (id) => SITE_STATUS[id]?.label ?? id
  const colorOf = (id) => Number.parseInt((SITE_STATUS[id]?.color ?? '#64748b').slice(1), 16)

  function measurementLine(site) {
    const measured = site.measured
    if (!measured) return 'No satellite measurement saved yet'
    const verdict = VERDICT[measured.result.verdict]?.label ?? measured.result.verdict
    return `${verdict} · ${formatSignedHa(measured.result.deltaM2)} (${formatAcquired(measured.earlier.acquiredAt).date} → ${formatAcquired(measured.later.acquiredAt).date})`
  }

  function statusEmbed(site, current) {
    const openTasks = current.tasks.filter((task) => task.siteId === site.id && !isTaskClosed(task))
    const row = current.budgets.find((item) => item.id === site.id)
    const taskLines = openTasks.slice(0, 4).map((task) => `• ${task.id} · ${task.title} — ${TASK_STATUS[task.status]?.label ?? task.status} (${task.assignee})`)
    return new EmbedBuilder()
      .setColor(colorOf(site.status))
      .setTitle(site.name)
      .setURL(`${appUrl}/sites/${site.id}`)
      .setDescription(site.reviewNote || null)
      .addFields(
        { name: 'Status', value: statusLabel(site.status), inline: true },
        { name: 'Open reports', value: String(site.openReports), inline: true },
        { name: 'Open tasks', value: String(openTasks.length), inline: true },
        { name: 'Satellite', value: measurementLine(site) },
        { name: 'Budget', value: row ? `${formatBdt(row.actual)} spent of ${formatBdt(row.planned)}${row.overBudget ? ' · over budget' : ''}` : 'Not set', inline: true },
        { name: 'Location', value: `${site.location} · ${site.area}`, inline: true },
        ...(taskLines.length ? [{ name: 'Work in progress', value: taskLines.join('\n') + (openTasks.length > 4 ? `\n…and ${openTasks.length - 4} more` : '') }] : []),
      )
      .setFooter({ text: 'TerraLink wetland monitoring' })
      .setTimestamp(new Date())
  }

  /** Plain-language lines for what changed at one lake between two reads. */
  function describeChanges(site, before, after, current) {
    const lines = []
    if (before.status !== after.status) lines.push(`**Status changed:** ${statusLabel(before.status)} → **${statusLabel(after.status)}**`)
    if (after.comparisonId && after.comparisonId !== before.comparisonId) lines.push(`**Satellite measurement saved:** ${measurementLine(site)}`)
    if (after.decisionAt && after.decisionAt !== before.decisionAt) {
      const decision = current.workspace.decisions[site.id]
      lines.push(`**Decision recorded** by ${decision.decidedBy}: ${statusLabel(decision.status)}${decision.note ? ` — ${decision.note}` : ''}`)
    }
    for (const [id, status] of Object.entries(after.reports)) {
      const report = current.communityReports.find((item) => item.id === id)
      if (!(id in before.reports)) {
        const ai = report?.aiAnalysis?.hasWaste ? ` · AI: waste ${Math.round(report.aiAnalysis.confidence * 100)}%` : ''
        lines.push(`**New community report** ${id}: ${REPORT_CATEGORIES[report?.category]?.label ?? 'Report'}${ai}`)
      } else if (before.reports[id] !== status) {
        lines.push(`**Report ${id}:** ${REPORT_STATUS[before.reports[id]]?.label} → ${REPORT_STATUS[status]?.label}`)
      }
    }
    for (const [id, status] of Object.entries(after.tasks)) {
      const task = current.tasks.find((item) => item.id === id)
      if (!(id in before.tasks)) lines.push(`**New task** ${id}: ${task?.title} — assigned to ${task?.assignee}, due ${task?.dueDate}`)
      else if (before.tasks[id] !== status) lines.push(`**Task ${id}:** ${TASK_STATUS[before.tasks[id]]?.label} → ${TASK_STATUS[status]?.label}`)
    }
    return lines
  }

  // Previous run's bot (Vite restarts the server when the config changes) is shut down first.
  await globalThis.__terralinkDiscord?.destroy?.().catch(() => undefined)
  const client = new Client({ intents: [GatewayIntentBits.Guilds] })
  globalThis.__terralinkDiscord = client
  let threads = readJson(THREADS_FILE, {})
  let previous = null
  let lastRev = null

  const saveThreads = () => {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(THREADS_FILE, JSON.stringify(threads, null, 2))
  }

  async function threadFor(site, current) {
    const known = threads[site.id] && await client.channels.fetch(threads[site.id]).catch(() => null)
    if (known) return known
    const forum = await client.channels.fetch(forumId)
    if (forum?.type !== ChannelType.GuildForum) throw new Error('DISCORD_FORUM_CHANNEL_ID is not a forum channel.')
    const thread = await forum.threads.create({ name: site.name, message: { content: `Live status of **${site.name}** from TerraLink. Updates are posted here automatically; use \`/status\` any time.`, embeds: [statusEmbed(site, current)] } })
    threads = { ...threads, [site.id]: thread.id }
    saveThreads()
    log(`created thread for ${site.name}`)
    return thread
  }

  async function check() {
    const current = readState()
    if (!current || current.rev === lastRev) return
    lastRev = current.rev
    const next = snapshot(current)
    for (const site of current.sites) {
      try {
        if (!previous) { await threadFor(site, current); continue }
        const before = previous[site.id]
        // A newly added water body gets its thread; there is nothing to compare yet.
        if (!before) { await threadFor(site, current); continue }
        const lines = describeChanges(site, before, next[site.id], current)
        if (!lines.length) continue
        const thread = await threadFor(site, current)
        await thread.send({ content: lines.join('\n'), embeds: before.status !== next[site.id].status ? [statusEmbed(site, current)] : [] })
      } catch (error) {
        log(`could not post for ${site.name}:`, error.message)
      }
    }
    previous = next
  }

  client.once(Events.ClientReady, async () => {
    log(`signed in as ${client.user.tag}`)
    try {
      await new REST().setToken(token).put(Routes.applicationGuildCommands(appId, guildId), { body: [statusCommand.toJSON()] })
      log('/status command registered')
    } catch (error) {
      log('could not register /status:', error.message)
    }
    await check()
    fs.watchFile(WORKSPACE_FILE, { interval: POLL_MS }, () => { void check() })
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.commandName !== 'status') return
    const current = readState()
    if (interaction.isAutocomplete()) {
      const typed = interaction.options.getFocused().toLowerCase()
      const choices = (current?.sites ?? []).filter((site) => site.name.toLowerCase().includes(typed)).slice(0, 25).map((site) => ({ name: site.name, value: site.id }))
      await interaction.respond(choices).catch(() => undefined)
      return
    }
    if (!interaction.isChatInputCommand()) return
    if (!current) {
      await interaction.reply({ content: 'TerraLink has no saved data yet. Open the app once so it can save the workspace.', ephemeral: true })
      return
    }
    // In a lake's thread, /status with no lake means that lake.
    const threadSite = Object.entries(threads).find(([, threadId]) => threadId === interaction.channelId)?.[0]
    const lakeId = interaction.options.getString('lake') ?? threadSite
    if (lakeId) {
      const site = current.sites.find((item) => item.id === lakeId || item.name.toLowerCase() === lakeId.toLowerCase())
      if (!site) {
        await interaction.reply({ content: `No water body called “${lakeId}”.`, ephemeral: true })
        return
      }
      await interaction.reply({ content: threads[site.id] && threadSite !== site.id ? `Updates for this lake: <#${threads[site.id]}>` : undefined, embeds: [statusEmbed(site, current)] })
      return
    }
    const lines = current.sites.map((site) => {
      const open = current.tasks.filter((task) => task.siteId === site.id && !isTaskClosed(task)).length
      return `**${site.name}** — ${statusLabel(site.status)} · ${site.openReports} open ${site.openReports === 1 ? 'report' : 'reports'} · ${open} open ${open === 1 ? 'task' : 'tasks'}${threads[site.id] ? ` · <#${threads[site.id]}>` : ''}`
    })
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle('All water bodies').setDescription(lines.join('\n')).setColor(0x1e4f53).setFooter({ text: 'TerraLink wetland monitoring' }).setTimestamp(new Date())] })
  })

  client.on(Events.Error, (error) => log('error:', error.message))
  await client.login(token)
}

/** Vite plugin: runs the bot alongside the dev server when the Discord settings are present. */
export function discordBot(env) {
  const missing = ['DISCORD_TOKEN', 'DISCORD_APP_ID', 'DISCORD_GUILD_ID', 'DISCORD_FORUM_CHANNEL_ID'].filter((key) => !env[key])
  return {
    name: 'terralink-discord-bot',
    apply: 'serve',
    configureServer(server) {
      if (missing.length) {
        log(`not started; add ${missing.join(', ')} to .env`)
        return
      }
      server.httpServer?.once('listening', () => {
        start(env, (id) => server.ssrLoadModule(id)).catch((error) => log('failed to start:', error.message))
      })
    },
  }
}
