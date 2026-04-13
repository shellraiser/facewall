import type { HighScore } from '../types';

const STORAGE_KEY = 'facewall_high_scores';

export function getHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HighScore[];
  } catch {
    return [];
  }
}

export function saveHighScore(score: Omit<HighScore, 'id' | 'date'>): HighScore {
  const entry: HighScore = {
    ...score,
    id: crypto.randomUUID(),
    date: Date.now(),
  };
  const scores = getHighScores();
  scores.push(entry);
  scores.sort((a, b) => b.correct / b.total - a.correct / a.total || b.correct - a.correct);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, 50)));
  return entry;
}
