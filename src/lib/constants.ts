export const EXAM_DURATION = 20 * 60 // 20 minutes in seconds
export const EXAM_QUESTIONS = 30
export const MAX_ERRORS = 3
// Smart Review schedule. A missed question is due again after REVIEW_STEPS_MS[0];
// each on-time correct answer moves it one step on. After the last step it graduates
// (leaves review). A wrong answer at any point sends it back to the start.
const DAY = 86_400_000
export const REVIEW_STEPS_MS = [1 * DAY, 3 * DAY, 7 * DAY]
