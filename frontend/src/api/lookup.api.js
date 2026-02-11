import { apiGet } from "./client";

export function lookupWord(word) {
  const q = encodeURIComponent(word.trim());
  return apiGet(`/lookup?word=${q}`);
}
