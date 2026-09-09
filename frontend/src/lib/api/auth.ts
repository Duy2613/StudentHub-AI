import { apiRequest } from "./client.ts";

export type SessionSnapshot = {
  authenticated: boolean;
  user?: { id: string; email?: string };
};

export function getSession(signal?: AbortSignal) {
  return apiRequest<SessionSnapshot>("/api/auth/session", { signal });
}
