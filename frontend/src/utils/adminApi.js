import { protectedFetch } from "./protectedFetch";

export const adminApi = {
  listUsers: () => protectedFetch("/admin/users"),
  setRole: (userId, is_admin) =>
    protectedFetch(`/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_admin }),
    }),
  deleteUser: (userId) => protectedFetch(`/admin/users/${userId}`, { method: "DELETE" }),
  cacheStats: () => protectedFetch("/admin/cache-stats"),
};