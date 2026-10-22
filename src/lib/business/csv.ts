function cell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

export function buildCsv(notes: string[], columns: string[], rows: string[][]) {
  const lines = [
    ...notes.map((note) => [cell("Note"), cell(note)].join(",")),
    "",
    columns.map(cell).join(","),
    ...rows.map((row) => row.map(cell).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
