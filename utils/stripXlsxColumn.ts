import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

/** Exact header we will delete. Anything else is left alone. */
const REPORT_FILE_PATH_LABEL = 'report file path';

function colLettersToIndex(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function indexToColLetters(n: number): string {
  let s = '';
  let x = n;
  while (x > 0) {
    x -= 1;
    s = String.fromCharCode(65 + (x % 26)) + s;
    x = Math.floor(x / 26);
  }
  return s;
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cellPlainText(cellXml: string): string {
  const parts = [...cellXml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)];
  return decodeXmlText(parts.map((m) => m[1]).join(''));
}

/**
 * Returns the column letter only when exactly one column has a cell whose
 * text is the Report File Path header. No match / ambiguous → skip.
 */
function findReportFilePathColumn(xml: string): string | null {
  const cellRe = /<c r="([A-Z]+)\d+"[^>]*>([\s\S]*?)<\/c>/g;
  const columns = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = cellRe.exec(xml))) {
    if (cellPlainText(match[2]).toLowerCase() !== REPORT_FILE_PATH_LABEL) continue;
    columns.add(match[1]);
    if (columns.size > 1) return null;
  }
  if (columns.size !== 1) return null;
  const col = [...columns][0];
  // Column A is titles / call ids — never strip it even if the label matched.
  if (colLettersToIndex(col) <= 1) return null;
  return col;
}

function sheetStillHasHeader(xml: string): boolean {
  return findReportFilePathColumn(xml) != null;
}

function stripColumnFromSheetXml(xml: string): string {
  const col = findReportFilePathColumn(xml);
  if (!col) return xml;

  const colIndex = colLettersToIndex(col);

  const cellRe = new RegExp(
    `<c r="${col}\\d+"[^/]*/>|<c r="${col}\\d+"[^>]*>[\\s\\S]*?</c>`,
    'g',
  );
  let next = xml.replace(cellRe, '');

  const colDefRe = new RegExp(
    `<col\\b(?=[^>]*\\bmin="${colIndex}")(?=[^>]*\\bmax="${colIndex}")[^>]*/>`,
    'g',
  );
  next = next.replace(colDefRe, '');

  next = next.replace(/\bref="([A-Z]+)(\d+):([A-Z]+)(\d+)"/g, (full, a, r1, b, r2) => {
    if (b === col) {
      const prev = indexToColLetters(colIndex - 1);
      return prev ? `ref="${a}${r1}:${prev}${r2}"` : full;
    }
    return full;
  });

  // If the header is still present, this sheet's structure wasn't what we
  // expected — leave it unchanged rather than shipping a half-edited tab.
  if (sheetStillHasHeader(next)) return xml;
  return next;
}

/**
 * Drop the "Report File Path" column from every worksheet that still has it.
 * If the column is already gone, the label changed, or the file isn't a
 * normal xlsx, the original bytes are returned unchanged.
 */
export function stripReportFilePathColumn(xlsx: ArrayBuffer): Uint8Array {
  try {
    const original = new Uint8Array(xlsx);
    const files = unzipSync(original);
    let changed = false;
    for (const name of Object.keys(files)) {
      if (!/^xl\/worksheets\/[^/]+\.xml$/.test(name)) continue;
      const xml = strFromU8(files[name]);
      const stripped = stripColumnFromSheetXml(xml);
      if (stripped === xml) continue;
      files[name] = strToU8(stripped);
      changed = true;
    }
    if (!changed) return original;
    return zipSync(files);
  } catch (err) {
    console.warn('[stripReportFilePathColumn] left export unchanged', err);
    return new Uint8Array(xlsx);
  }
}
