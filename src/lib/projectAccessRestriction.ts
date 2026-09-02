type ProjectAccessRestrictionListener = (projectId: string) => void;

const listeners = new Set<ProjectAccessRestrictionListener>();
let restrictedProjectId: string | null = null;

export function notifyProjectAccessRestricted(projectId: string): void {
  if (restrictedProjectId === projectId) return;
  restrictedProjectId = projectId;
  listeners.forEach((listener) => listener(projectId));
}

export function subscribeProjectAccessRestricted(
  listener: ProjectAccessRestrictionListener
): () => void {
  listeners.add(listener);
  if (restrictedProjectId) listener(restrictedProjectId);
  return () => listeners.delete(listener);
}

export function resetProjectAccessRestriction(): void {
  restrictedProjectId = null;
}

export function isProjectAccessRestrictionActive(): boolean {
  return restrictedProjectId !== null;
}
