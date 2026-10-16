import { CheckCircle2, Circle, CircleDot, CircleSlash, Clock3 } from 'lucide-react'

/* Stage is identified by its icon shape, keeping the board monochrome. */
export const STAGE_ICONS = {
  open: Circle,
  in_progress: CircleDot,
  blocked: CircleSlash,
  awaiting_verification: Clock3,
  completed: CheckCircle2,
}

export const STAGE_EMPTY = {
  open: 'No new work waiting',
  in_progress: 'Nothing being worked on',
  blocked: 'Nothing is blocked',
  awaiting_verification: 'No completions to verify',
  completed: 'Nothing signed off yet',
}

export const stageTotal = (stageTasks) => stageTasks.reduce((sum, task) => sum + (Number(task.estimatedCost) || 0), 0)
