import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import {
  getDisplayOutcomeLabelFromFields,
} from '../pages/OperatorDashboard/callHistoryUtils';

/** Exact header we will delete. Anything else is left alone. */
const REPORT_FILE_PATH_LABEL = 'report file path';

type DataHeaderKey = 'status' | 'duration' | 'agent' | 'reason' | 'started' | 'ended';

const DATA_HEADERS: Record<string, DataHeaderKey> = {
  'outcome status': 'status',
  'duration seconds': 'duration',
  'final agent': 'agent',
  'outcome reason': 'reason',
  'started at': 'started',
  'ended at': 'ended',
};

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

function encodeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellPlainText(cellXml: string): string {
  const parts = [...cellXml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)];
  if (parts.length > 0) return decodeXmlText(parts.map((m) => m[1]).join(''));
  const v = cellXml.match(/<v>([\s\S]*?)<\/v>/);
  return v ? decodeXmlText(v[1]) : '';
}

function findUniqueHeaderColumn(xml: string, label: string): string | null {
  const cellRe = /<c r="([A-Z]+)\d+"[^>]*>([\s\S]*?)<\/c>/g;
  const columns = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = cellRe.exec(xml))) {
    if (cellPlainText(match[2]).toLowerCase() !== label) continue;
    columns.add(match[1]);
    if (columns.size > 1) return null;
  }
  if (columns.size !== 1) return null;
  return [...columns][0];
}

/**
 * Returns the column letter only when exactly one column has a cell whose
 * text is the Report File Path header. No match / ambiguous → skip.
 */
function findReportFilePathColumn(xml: string): string | null {
  const col = findUniqueHeaderColumn(xml, REPORT_FILE_PATH_LABEL);
  if (!col) return null;
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

  if (sheetStillHasHeader(next)) return xml;
  return next;
}

function findDataHeaderMap(xml: string): {
  headerRow: number;
  cols: Partial<Record<DataHeaderKey, string>>;
} | null {
  const cellRe = /<c r="([A-Z]+)(\d+)"[^>]*>([\s\S]*?)<\/c>/g;
  const cols: Partial<Record<DataHeaderKey, string>> = {};
  const seen = new Map<DataHeaderKey, string>();
  let headerRow: number | null = null;
  let match: RegExpExecArray | null;
  while ((match = cellRe.exec(xml))) {
    const key = DATA_HEADERS[cellPlainText(match[3]).toLowerCase()];
    if (!key) continue;
    const existing = seen.get(key);
    if (existing && existing !== match[1]) return null;
    seen.set(key, match[1]);
    cols[key] = match[1];
    if (key === 'status') headerRow = Number(match[2]);
  }
  if (!cols.status || headerRow == null || !Number.isFinite(headerRow)) return null;
  return { headerRow, cols };
}

function parseDurationSeconds(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw.replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function rewriteOutcomeStatusInSheet(xml: string): string {
  const found = findDataHeaderMap(xml);
  if (!found) return xml;
  const { headerRow, cols } = found;
  const statusCol = cols.status;
  if (!statusCol) return xml;

  return xml.replace(/<row(\s[^>]*)>([\s\S]*?)<\/row>/g, (full, attrs: string, inner: string) => {
    const rowMatch = attrs.match(/\br="(\d+)"/);
    if (!rowMatch) return full;
    const rowNum = Number(rowMatch[1]);
    if (rowNum <= headerRow) return full;

    const values = new Map<string, string>();
    const cellRe = /<c r="([A-Z]+)\d+"[^>]*>([\s\S]*?)<\/c>/g;
    let cell: RegExpExecArray | null;
    while ((cell = cellRe.exec(inner))) {
      values.set(cell[1], cellPlainText(cell[2]));
    }

    const current = values.get(statusCol);
    if (current == null || current === '') return full;

    const nextLabel = getDisplayOutcomeLabelFromFields({
      outcomeStatus: current,
      finalAgent: cols.agent ? values.get(cols.agent) : undefined,
      outcomeReason: cols.reason ? values.get(cols.reason) : undefined,
      durationSeconds: parseDurationSeconds(cols.duration ? values.get(cols.duration) : undefined),
      startedAt: cols.started ? values.get(cols.started) : undefined,
      endedAt: cols.ended ? values.get(cols.ended) : undefined,
    });
    if (!nextLabel || nextLabel === current) return full;

    const encoded = encodeXmlText(nextLabel);
    const statusCellRe = new RegExp(
      `(<c r="${statusCol}${rowNum}"[^>]*>[\\s\\S]*?<t(?:\\s[^>]*)?>)[\\s\\S]*?(</t>)`,
    );
    if (!statusCellRe.test(inner)) return full;
    const nextInner = inner.replace(statusCellRe, `$1${encoded}$2`);
    return `<row${attrs}>${nextInner}</row>`;
  });
}

function sanitizeSheetXml(xml: string): string {
  const withStatuses = rewriteOutcomeStatusInSheet(xml);
  return stripColumnFromSheetXml(withStatuses);
}

/**
 * Align Outcome Status wording with the dashboard, then drop Report File Path
 * from every worksheet that still has it. If a sheet's structure doesn't match
 * (column already gone, label renamed, not an xlsx), that sheet / file is left
 * unchanged rather than half-edited.
 */
export function sanitizeCallsExportXlsx(xlsx: ArrayBuffer): Uint8Array {
  try {
    const original = new Uint8Array(xlsx);
    const files = unzipSync(original);
    let changed = false;
    for (const name of Object.keys(files)) {
      if (!/^xl\/worksheets\/[^/]+\.xml$/.test(name)) continue;
      const xml = strFromU8(files[name]);
      const next = sanitizeSheetXml(xml);
      if (next === xml) continue;
      files[name] = strToU8(next);
      changed = true;
    }
    if (!changed) return original;
    return zipSync(files);
  } catch (err) {
    console.warn('[sanitizeCallsExportXlsx] left export unchanged', err);
    return new Uint8Array(xlsx);
  }
}
