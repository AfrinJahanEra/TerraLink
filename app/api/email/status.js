import { createEmailHandler } from '../../emailServer.js'

/**
 * Vercel counterpart of the local data server's GET /api/email/status, so the deployed demo
 * can report whether the SMTP settings exist. The credentials stay in the function's env.
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(createEmailHandler(process.env).status())
}
