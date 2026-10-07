/** Tiny CSV writer for downloads made in the browser. No library, no server call. */

export type CsvCell = string | number | boolean | null | undefined;

/**
 * One cell as CSV text. Numbers stay numbers (so spreadsheets can sum and sort them, and negatives parse).
 * Text that a spreadsheet could read as a formula (starting with = + - @) gets a leading apostrophe.
 */
export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows to CSV text: CRLF line endings, and a byte-order mark so Excel reads it as UTF-8. */
export function toCsv(rows: CsvCell[][]): string {
  return '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
