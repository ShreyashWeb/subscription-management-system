/**
 * Sanitizes a single CSV cell against spreadsheet formula injection (CSV Injection / CWE-1236)
 * and formats it according to RFC-4180 specification.
 *
 * Rules:
 * 1. If cell starts with '=', '+', '-', '@', '\t', or '\r', prefix with single quote "'"
 * 2. If cell contains comma, double-quote, newline, or carriage return:
 *    - Escape internal double quotes by doubling them (""")
 *    - Enclose the entire value in double quotes ("...")
 */
export function formatCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // Strip null bytes
  str = str.replace(/\0/g, "");

  // Prevent spreadsheet formula injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // RFC-4180 quoting
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Encodes an array of cells into an RFC-4180 compliant CSV line with CRLF delimiter.
 */
export function formatCsvRow(cells: unknown[]): string {
  return cells.map(formatCsvCell).join(",") + "\r\n";
}

