import { apiFetch } from "./api";

export const grammarApi = {
  createSession: () => apiFetch("/grammar/sessions", { method: "POST" }),
  getSession: (id) => apiFetch(`/grammar/sessions/${id}`),
  submit: (id, answers) =>
    apiFetch(`/grammar/sessions/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),
};
