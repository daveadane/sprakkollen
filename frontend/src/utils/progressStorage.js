const KEY = "sprakkollen_progress";

const defaultProgress = {
  xp: 0,
  streakDays: 0,
  lastStreakDay: null,
  sessions: 0,
  correct: 0,
  total: 0,
  accuracy: 0,
  weakWords: ["bord", "fönster", "äpple"],
  lastPractice: { score: 0, total: 0 },

  // ✅ grammar MUST be inside defaultProgress
  grammar: {
    sessions: 0,
    correct: 0,
    total: 0,
    accuracy: 0,
    lastQuiz: { score: 0, total: 0 },
  },
};


function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress;
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
  // 🔔 notify pages to re-read progress immediately
  window.dispatchEvent(new Event("sprakkollen:progress-updated"));
}

export function recordPractice({ score, total }) {
  const p = loadProgress();

  const today = todayKey();
  const lastDay = p.lastStreakDay;


  // streak: +1 once per day when you practice
  let nextStreak = p.streakDays ?? 0;
  if (lastDay !== today) nextStreak += 1;

  const gainedXp = Math.max(1, score) * 10;

  const nextTotal = (p.total ?? 0) + total;
  const nextCorrect = (p.correct ?? 0) + score;
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
    lastPractice: { score, total },
  };

  saveProgress(next);
  return next;
}

export function resetProgress() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("sprakkollen:progress-updated"));
}

export function recordGrammarQuiz({ score, total }) {
  const p = loadProgress();

  const g = p.grammar ?? {
    sessions: 0,
    correct: 0,
    total: 0,
    accuracy: 0,
    lastQuiz: { score: 0, total: 0 },
  };

  const nextTotal = (g.total ?? 0) + total;
  const nextCorrect = (g.correct ?? 0) + score;
  const nextAccuracy = nextTotal ? Math.round((nextCorrect / nextTotal) * 100) : 0;

  const gainedXp = Math.max(1, score) * 5; 

  const next = {
    ...p,
    xp: (p.xp ?? 0) + gainedXp,
    grammar: {
      sessions: (g.sessions ?? 0) + 1,
      correct: nextCorrect,
      total: nextTotal,
      accuracy: nextAccuracy,
      lastQuiz: { score, total },
    },
  };

  saveProgress(next);
  return next;
}
