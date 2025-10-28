import { apiClient } from "@/lib/apiClient";

export type Project = unknown; // refine later

export const ProjectsService = {
  create(payload: Record<string, unknown>) {
    return apiClient.post<Project>("/v1/projects", payload);
  },
  // Optional helper to check subdomain availability (endpoint can be adjusted server-side)
  checkSubdomainAvailability(subdomain: string) {
    return apiClient.get<{ available: boolean }>(`/v1/projects/subdomain/availability`, { query: { subdomain } });
  },
  update(payload: Record<string, unknown>) {
    return apiClient.patch<Project>(`/v1/projects`, payload);
  },
  remove(payload: Record<string, unknown>) {
    // API uses DELETE with body; some servers accept JSON body for DELETE
    return apiClient.delete<void>(`/v1/projects`, { body: payload } as any);
  },
  list(query?: Record<string, string | number | boolean>) {
    return apiClient.get<Project[]>("/v1/projects", { query });
  },
  myProfile(query?: Record<string, string | number | boolean>) {
    return apiClient.get<unknown>("/v1/projects/profile", { query });
  },
};


