import { protectedFetch } from "./protectedFetch";

export const grammarApi = {
  createSession: () => protectedFetch("/grammar/sessions", { method: "POST" }),
  getSession: (id) => protectedFetch(`/grammar/sessions/${id}`),
  submit: (id, answers) =>
    protectedFetch(`/grammar/sessions/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),
};