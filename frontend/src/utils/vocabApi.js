import { protectedFetch } from "./protectedFetch";

export const vocabApi = {
  list: () => protectedFetch("/vocab"),
  create: (payload) =>
    protectedFetch("/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    protectedFetch(`/vocab/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id) => protectedFetch(`/vocab/${id}`, { method: "DELETE" }),
};