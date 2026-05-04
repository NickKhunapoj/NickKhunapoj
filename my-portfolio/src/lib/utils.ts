// Utility functions

/** Format a date string to a readable format */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

/** Format a date range (e.g., "Jan 2023 — Present") */
export function formatDateRange(start: string | null, end: string | null): string {
  const startStr = formatDate(start);
  const endStr = end ? formatDate(end) : 'Present';
  if (!startStr) return endStr;
  return `${startStr} — ${endStr}`;
}

/** Format a full date */
export function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Parse JSON array field safely */
export function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}
