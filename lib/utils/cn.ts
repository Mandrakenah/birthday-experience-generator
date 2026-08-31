// Tailwind className concatenation helper (spec 5.5).
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
