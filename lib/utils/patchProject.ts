/**
 * PATCH /api/projects from the editor. Resolves to false on any failure,
 * including network errors, so callers never leave "Saving…" stuck.
 * `keepalive` lets a save started during page unload still complete.
 */
export async function patchProject(
  id: string,
  fields: Record<string, unknown>,
  { keepalive = false }: { keepalive?: boolean } = {}
): Promise<boolean> {
  try {
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields }),
      keepalive,
    });
    return res.ok;
  } catch {
    return false;
  }
}
