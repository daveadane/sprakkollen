import { protectedFetch } from "./protectedFetch";

export const practiceApi = {
  createSession: () => protectedFetch("/practice/sessions", { method: "POST" }),
  getSession: (id) => protectedFetch(`/practice/sessions/${id}`),
  submit: (id, answers) =>
    protectedFetch(`/practice/sessions/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),
};