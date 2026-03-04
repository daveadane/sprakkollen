// src/utils/progressApi.js
import { apiFetch } from "./api";

// Backend endpoint: GET /api/progress
export async function getProgress() {
  return apiFetch("/progress", { method: "GET" });
}

// Optional helper: safe defaults so UI never crashes
export function normalizeProgress(p) {
  const safe = p || {};
  return {
    xp: safe.xp ?? 0,
    streakDays: safe.streakDays ?? 0,
    lastStreakDay: safe.lastStreakDay ?? null,
    weakWords: safe.weakWords ?? [],
    practice: safe.practice ?? { sessions: 0, correct: 0, total: 0, accuracy: 0, lastPractice: { score: 0, total: 0 } },
    grammar: safe.grammar ?? { sessions: 0, correct: 0, total: 0, accuracy: 0, lastQuiz: { score: 0, total: 0 } },
  };
}
