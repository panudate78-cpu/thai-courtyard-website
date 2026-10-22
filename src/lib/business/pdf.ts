/** Minimal PDF writer (Courier, WinAnsi). No extra dependency. */

function pdfText(value: string) {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 63;
    if (ch === "\\") out += "\\\\";
    else if (ch === "(") out += "\\(";
    else if (ch === ")") out += "\\)";
    else if (ch === "£") out += "\\243";
    else if (code >= 32 && code <= 126) out += ch;
    else if (code >= 160 && code <= 255) out += `\\${code.toString(8).padStart(3, "0")}`;
    else out += "?";
  }
  return out;
}

function wrap(line: string, width: number) {
  if (line.length <= width) return [line];
  const parts: string[] = [];
  let rest = line;
  while (rest.length > width) {
    let cut = rest.lastIndexOf(" ", width);
    if (cut < 16) cut = width;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

export function buildPdf(title: string, lines: string[]): Buffer {
  const wrapped = lines.flatMap((line) => wrap(line, 92));
  const pageSize = 56;
  const chunks: string[][] = [];
  for (let i = 0; i < wrapped.length; i += pageSize) chunks.push(wrapped.slice(i, i + pageSize));
  if (!chunks.length) chunks.push([""]);

  const objects: string[] = [];
  const pageIds: number[] = [];
  let nextId = 3;

  const contentIds: number[] = [];
  for (const chunk of chunks) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);
    contentIds.push(contentId);
    const ops = [
      "BT",
      "/F2 14 Tf",
      `48 800 Td (${pdfText(title)}) Tj`,
      "/F1 9 Tf",
      "0 -22 Td",
      ...chunk.map((line, index) => (index === 0 ? `(${pdfText(line)}) Tj` : `0 -12 Td (${pdfText(line)}) Tj`)),
      "ET",
    ];
    const stream = ops.join("\n");
    objects[contentId] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${nextId} 0 R /F2 ${nextId + 1} 0 R >> >> >>`;
  }

  const font1 = nextId;
  const font2 = nextId + 1;
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;
  objects[font1] = `<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>`;
  objects[font2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  const maxId = font2;
  for (let id = 1; id <= maxId; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "latin1");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${maxId + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id <= maxId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}
