const KEY = "sprakkollen_progress";

const defaultProgress = {
  xp: 0,

  streakDays: 0,
  lastStreakDay: null, // "YYYY-MM-DD"

  weakWords: ["bord", "fönster", "äpple"],

  // ✅ Practice module
  practice: {
    sessions: 0,
    correct: 0,
    total: 0,
    accuracy: 0,
    lastPractice: { score: 0, total: 0 },
  },

  // ✅ Grammar module
  grammar: {
    sessions: 0,
    correct: 0,
    total: 0,
    accuracy: 0,
    lastQuiz: { score: 0, total: 0 },
  },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeModule(m) {
  const total = Math.max(0, Number(m?.total ?? 0));
  const correct = clamp(Number(m?.correct ?? 0), 0, total);
  const accuracy = total ? clamp(Math.round((correct / total) * 100), 0, 100) : 0;
  const sessions = Math.max(0, Number(m?.sessions ?? 0));

  return { ...m, total, correct, accuracy, sessions };
}

/**
 * Backward compatibility:
 * Old schema had: sessions/correct/total/accuracy + lastPractice at root.
 * We migrate that into progress.practice.
 */
function migrateOldSchema(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const hasOldPractice =
    raw.sessions != null || raw.correct != null || raw.total != null || raw.accuracy != null;

  if (!raw.practice && hasOldPractice) {
    raw.practice = {
      sessions: Number(raw.sessions ?? 0),
      correct: Number(raw.correct ?? 0),
      total: Number(raw.total ?? 0),
      accuracy: Number(raw.accuracy ?? 0),
      lastPractice: raw.lastPractice ?? { score: 0, total: 0 },
    };
  }

  // remove old fields to avoid confusion (optional, but recommended)
  delete raw.sessions;
  delete raw.correct;
  delete raw.total;
  delete raw.accuracy;
  delete raw.lastPractice;

  return raw;
}

function normalizeProgress(p) {
  const next = {
    ...defaultProgress,
    ...(p || {}),
  };

  next.practice = normalizeModule({
    ...defaultProgress.practice,
    ...(next.practice || {}),
  });

  // ensure lastPractice exists
  next.practice.lastPractice = next.practice.lastPractice ?? { score: 0, total: 0 };

  next.grammar = normalizeModule({
    ...defaultProgress.grammar,
    ...(next.grammar || {}),
  });

  next.grammar.lastQuiz = next.grammar.lastQuiz ?? { score: 0, total: 0 };

  // streak + xp sanity
  next.xp = Math.max(0, Number(next.xp ?? 0));
  next.streakDays = Math.max(0, Number(next.streakDays ?? 0));
  next.lastStreakDay = next.lastStreakDay ?? null;

  return next;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress;

    const parsed = JSON.parse(raw);
    const migrated = migrateOldSchema(parsed);
    return normalizeProgress(migrated);
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress) {
  const normalized = normalizeProgress(progress);
  localStorage.setItem(KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event("sprakkollen:progress-updated"));
}

export function resetProgress() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("sprakkollen:progress-updated"));
}

export function resetGrammarStats() {
  const p = loadProgress();
  saveProgress({
    ...p,
    grammar: { ...defaultProgress.grammar },
  });
}

export function resetPracticeStats() {
  const p = loadProgress();
  saveProgress({
    ...p,
    practice: { ...defaultProgress.practice },
  });
}

export function recordPractice({ score, total }) {
  const p = loadProgress();

  const today = todayKey();
  const lastDay = p.lastStreakDay;

  let nextStreak = p.streakDays ?? 0;
  if (lastDay !== today) nextStreak += 1;

  const gainedXp = Math.max(1, Number(score)) * 10;

  const prev = p.practice ?? defaultProgress.practice;

  const nextTotal = (prev.total ?? 0) + Number(total);
  const rawCorrect = (prev.correct ?? 0) + Number(score);

  const nextCorrect = clamp(rawCorrect, 0, nextTotal);
  const nextAccuracy = nextTotal
    ? clamp(Math.round((nextCorrect / nextTotal) * 100), 0, 100)
    : 0;

  const next = {
    ...p,
    xp: (p.xp ?? 0) + gainedXp,
    streakDays: nextStreak,
    lastStreakDay: today,
    practice: {
      ...prev,
      sessions: (prev.sessions ?? 0) + 1,
      correct: nextCorrect,
      total: nextTotal,
      accuracy: nextAccuracy,
      lastPractice: { score: Number(score), total: Number(total) },
    },
  };

  saveProgress(next);
  return next;
}

export function recordGrammarQuiz({ score, total }) {
  const p = loadProgress();
  const g = p.grammar ?? defaultProgress.grammar;

  const nextTotal = (g.total ?? 0) + Number(total);
  const rawCorrect = (g.correct ?? 0) + Number(score);

  const nextCorrect = clamp(rawCorrect, 0, nextTotal);
  const nextAccuracy = nextTotal
    ? clamp(Math.round((nextCorrect / nextTotal) * 100), 0, 100)
    : 0;

  const gainedXp = Math.max(1, Number(score)) * 5;

  const next = {
    ...p,
    xp: (p.xp ?? 0) + gainedXp,
    grammar: {
      ...g,
      sessions: (g.sessions ?? 0) + 1,
      correct: nextCorrect,
      total: nextTotal,
      accuracy: nextAccuracy,
      lastQuiz: { score: Number(score), total: Number(total) },
    },
  };

  saveProgress(next);
  return next;
}
