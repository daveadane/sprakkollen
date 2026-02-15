const KEY = "sprakkollen_progress";

export function loadProgress() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return {
      xp: 0,
      streakDays: 0,
      lastStreakDay: null,
      lastPractice: null,
    };
  }
  return JSON.parse(raw);
}

export function saveProgress(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}


function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function recordPractice({ score, total }) {
  const p = loadProgress();

  const today = todayKey();
  const lastDay = p.lastStreakDay || null;

  let nextStreak = p.streakDays ?? 0;
  if (lastDay !== today) {
    nextStreak = nextStreak + 1; // simple rule: +1 per day you practice
  }

  const gainedXp = Math.max(1, score) * 10; // example rule

  const next = {
    ...p,
    xp: (p.xp ?? 0) + gainedXp,
    streakDays: nextStreak,
    lastStreakDay: today,
    lastPractice: { score, total },
  };

  saveProgress(next);
  return next;
}

