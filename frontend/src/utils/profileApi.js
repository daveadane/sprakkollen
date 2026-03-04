import { protectedFetch } from "./protectedFetch";

export const profileApi = {
  me: () => protectedFetch("/auth/me"),
};