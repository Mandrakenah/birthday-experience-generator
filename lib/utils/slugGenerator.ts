export function generateSlug(recipientName: string): string {
  const clean = (recipientName || 'birthday')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  const random = Math.random().toString(36).slice(2, 7);
  return clean ? `${clean}-${random}` : `birthday-${random}`;
}
