const KEY = "sprakkollen_progress_v1";

const DEFAULT = {
  xp: 120,
  streakDays: 5,
  lastPractice: { score: 4, total: 5 },
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function saveProgress(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

// helper: update XP quickly (later used by Practice)
export function addXp(amount = 5) {
  const p = loadProgress();
  const next = { ...p, xp: p.xp + amount };
  saveProgress(next);
  return next;
}
