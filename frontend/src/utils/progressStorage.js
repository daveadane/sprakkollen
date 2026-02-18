const KEY = "sprakkollen_progress";

const defaultProgress = {
  // Global / practice stats
  xp: 0,
  streakDays: 0,
  lastStreakDay: null, // YYYY-MM-DD
  sessions: 0,
  correct: 0,
  total: 0,
  accuracy: 0, // %
  weakWords: ["bord", "fönster", "äpple"],
  lastPractice: { score: 0, total: 0 },

  // Grammar stats
  grammar: {
    sessions: 0,
    correct: 0,
    total: 0,
    accuracy: 0, // %
    lastQuiz: { score: 0, total: 0 },
  },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function clamp01to100(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * Repairs corrupted progress (ex: grammar.correct > grammar.total)
 * and recomputes accuracies safely.
 */
function repairProgress(p) {
  const next = { ...defaultProgress, ...p };

  // --- Practice repair ---
  const practiceTotal = Math.max(0, Number(next.total ?? 0));
  const practiceCorrect = Math.max(0, Math.min(Number(next.correct ?? 0), practiceTotal));
  next.total = practiceTotal;
  next.correct = practiceCorrect;
  next.accuracy = practiceTotal
    ? clamp01to100(Math.round((practiceCorrect / practiceTotal) * 100))
    : 0;

  // Ensure lastPractice shape
  if (!next.lastPractice || typeof next.lastPractice !== "object") {
    next.lastPractice = { score: 0, total: 0 };
  } else {
    const lpTotal = Math.max(0, Number(next.lastPractice.total ?? 0));
    const lpScore = Math.max(0, Math.min(Number(next.lastPractice.score ?? 0), lpTotal));
    next.lastPractice = { score: lpScore, total: lpTotal };
  }

  // --- Grammar repair ---
  const g = { ...defaultProgress.grammar, ...(next.grammar ?? {}) };
  const gTotal = Math.max(0, Number(g.total ?? 0));
  const gCorrect = Math.max(0, Math.min(Number(g.correct ?? 0), gTotal));

  g.total = gTotal;
  g.correct = gCorrect;
  g.accuracy = gTotal ? clamp01to100(Math.round((gCorrect / gTotal) * 100)) : 0;

  if (!g.lastQuiz || typeof g.lastQuiz !== "object") {
    g.lastQuiz = { score: 0, total: 0 };
  } else {
    const lqTotal = Math.max(0, Number(g.lastQuiz.total ?? 0));
    const lqScore = Math.max(0, Math.min(Number(g.lastQuiz.score ?? 0), lqTotal));
    g.lastQuiz = { score: lqScore, total: lqTotal };
  }

  next.grammar = g;

  // XP should never be negative
  next.xp = Math.max(0, Number(next.xp ?? 0));

  return next;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress;

    const parsed = JSON.parse(raw);
    return repairProgress(parsed);
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress) {
  const repaired = repairProgress(progress);
  localStorage.setItem(KEY, JSON.stringify(repaired));
  window.dispatchEvent(new Event("sprakkollen:progress-updated"));
}

/**
 * Practice: updates streak, xp, sessions, correct/total/accuracy.
 */
export function recordPractice({ score, total }) {
  const p = loadProgress();

  const safeTotal = Math.max(0, Number(total ?? 0));
  const safeScore = Math.max(0, Math.min(Number(score ?? 0), safeTotal));

  const today = todayKey();
  const lastDay = p.lastStreakDay;

  // streak +1 once per day you practice
  let nextStreak = p.streakDays ?? 0;
  if (lastDay !== today) nextStreak += 1;

  const gainedXp = Math.max(1, safeScore) * 10;

  const nextTotal = (p.total ?? 0) + safeTotal;
  const nextCorrect = (p.correct ?? 0) + safeScore;
  const nextAccuracy = nextTotal ? Math.round((nextCorrect / nextTotal) * 100) : 0;

  const next = {
    ...p,
    xp: (p.xp ?? 0) + gainedXp,
    streakDays: nextStreak,
    lastStreakDay: today,
    sessions: (p.sessions ?? 0) + 1,
    correct: nextCorrect,
    total: nextTotal,
    accuracy: nextAccuracy,
    lastPractice: { score: safeScore, total: safeTotal },
  };

  saveProgress(next);
  return next;
}

/**
 * Grammar quiz: updates grammar sub-stats + awards smaller XP.
 */
export function recordGrammarQuiz({ score, total }) {
  const p = loadProgress();

  const safeTotal = Math.max(0, Number(total ?? 0));
  const safeScore = Math.max(0, Math.min(Number(score ?? 0), safeTotal));

  const g = p.grammar ?? defaultProgress.grammar;

  const nextTotal = (g.total ?? 0) + safeTotal;
  const nextCorrect = (g.correct ?? 0) + safeScore;
  const nextAccuracy = nextTotal ? Math.round((nextCorrect / nextTotal) * 100) : 0;

  const gainedXp = Math.max(1, safeScore) * 5;

  const next = {
    ...p,
    xp: (p.xp ?? 0) + gainedXp,
    grammar: {
      sessions: (g.sessions ?? 0) + 1,
      correct: nextCorrect,
      total: nextTotal,
      accuracy: nextAccuracy,
      lastQuiz: { score: safeScore, total: safeTotal },
    },
  };

  saveProgress(next);
  return next;
}

export function resetProgress() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("sprakkollen:progress-updated"));
}

export function resetGrammarStats() {
  const p = loadProgress();
  const next = {
    ...p,
    grammar: { ...defaultProgress.grammar },
  };
  saveProgress(next);
}
