/**
 * Client for the phone-script editor API on the dashboard app
 * (agentic-voice-backend: src/routers/dashboard/scripts.py).
 *
 * Every request needs the SARH passcode (sent by sarhPasscodeHeaders) and
 * carries the editor's name for the change history.
 */
import {
  getPoseidonApiBaseUrl,
  sarhPasscodeHeaders,
  setSarhPasscode,
  SARH_PASSCODE_INVALID_EVENT,
} from './poseidonService';

export interface ScriptLine {
  id: string;
  text: string;
  label: string;
}

export interface ScriptStep {
  id: string;
  number: string;
  title: string;
  lines: ScriptLine[];
  saves: { key: string; label: string }[];
}

export interface SlotSummary {
  version: number;
  updated_at?: string;
  updated_by?: string;
}

export interface LiveScriptsSetting {
  use_published: boolean;
  hard_off: boolean;
  updated_at?: string;
  updated_by?: string;
  note?: string;
}

export interface ScriptOverviewAgent {
  agent_type: string;
  title: string;
  description: string;
  testing_only: boolean;
  has_draft: boolean;
  test_line: SlotSummary | null;
  live_line: SlotSummary | null;
}

export interface ScriptsOverview {
  live_scripts: LiveScriptsSetting;
  agents: ScriptOverviewAgent[];
  flow: { initial_agent: string; routes: { from: string; to: string; label: string }[] };
}

export interface LineChange {
  line_id: string;
  step: string;
  before: string | null;
  after: string;
}

export interface ScriptVersionSummary {
  version: number;
  note: string;
  source: string;
  created_at?: string;
  created_by?: string;
  was_live: boolean;
}

export interface TestCallEvidence {
  version: number | null;
  test_calls: number;
  completed_test_calls: number;
}

export interface ScriptBlock {
  id: string;
  kind: 'rules' | 'step' | 'tail';
  title: string;
  template: string;
  number?: string;
  lines?: ScriptLine[];
}

export interface ScriptDetail {
  agent_type: string;
  title: string;
  description: string;
  steps: ScriptStep[];
  showing: 'draft' | 'test_line' | 'live_line' | 'built_in';
  draft: { updated_at?: string; updated_by?: string } | null;
  test_line: SlotSummary | null;
  test_calls: TestCallEvidence | null;
  live_line: SlotSummary | null;
  changes_vs_live: LineChange[];
  warnings: string[];
  versions: ScriptVersionSummary[];
  structure: { blocks: ScriptBlock[] };
}

/** Errors the API explains in plain language ({errors, warnings}). */
export class ScriptEditorError extends Error {
  errors: string[];
  warnings: string[];
  constructor(errors: string[], warnings: string[] = []) {
    super(errors.join(' '));
    this.errors = errors;
    this.warnings = warnings;
  }
}

const EDITOR_NAME_KEY = 'sarh_script_editor_name';

export function getEditorName(): string {
  try {
    return localStorage.getItem(EDITOR_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function setEditorName(name: string): void {
  try {
    localStorage.setItem(EDITOR_NAME_KEY, name.trim());
  } catch {
    /* not critical: history just shows "editor" */
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getPoseidonApiBaseUrl()}/api/dashboard/scripts${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Editor-Name': getEditorName(),
      ...sarhPasscodeHeaders(),
      ...(init.headers || {}),
    },
  });
  if (response.ok) return response.json();

  if (response.status === 401) {
    setSarhPasscode(null);
    window.dispatchEvent(new Event(SARH_PASSCODE_INVALID_EVENT));
    throw new ScriptEditorError(['Please enter the passcode again.']);
  }
  let detail: unknown = null;
  try {
    detail = (await response.json()).detail;
  } catch {
    /* fall through */
  }
  if (detail && typeof detail === 'object' && Array.isArray((detail as { errors?: unknown }).errors)) {
    const d = detail as { errors: string[]; warnings?: string[] };
    throw new ScriptEditorError(d.errors, d.warnings || []);
  }
  throw new ScriptEditorError([
    typeof detail === 'string' ? detail : `Something went wrong (${response.status}). Please try again.`,
  ]);
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const scriptEditor = {
  overview: () => call<ScriptsOverview>(''),
  get: (agent: string) => call<ScriptDetail>(`/${agent}`),
  saveLines: (agent: string, lines: Record<string, string>) =>
    call<{ saved: boolean; warnings: string[] }>(`/${agent}/draft`, { method: 'PUT', ...json({ lines }) }),
  discardDraft: (agent: string) => call<{ discarded: boolean }>(`/${agent}/draft`, { method: 'DELETE' }),
  resetDraft: (agent: string, source: 'built_in' | 'test_line' | 'live_line') =>
    call<{ saved: boolean }>(`/${agent}/draft/reset`, { method: 'POST', ...json({ source }) }),
  sendToTest: (agent: string, note: string) =>
    call<{ version: number; message: string; warnings: string[] }>(`/${agent}/send-to-test`, {
      method: 'POST',
      ...json({ note }),
    }),
  testCalls: (agent: string) => call<TestCallEvidence>(`/${agent}/test-calls`),
  makeLive: (agent: string, version: number) =>
    call<{ live_version: number; live_scripts_on: boolean; message: string }>(`/${agent}/make-live`, {
      method: 'POST',
      ...json({ version }),
    }),
  rollback: (agent: string, target: number | 'built_in') =>
    call<{ live_version: number | null; message: string }>(`/${agent}/rollback`, {
      method: 'POST',
      ...json({ target }),
    }),
  setLiveScripts: (use_published: boolean) =>
    call<LiveScriptsSetting>('/settings/live', { method: 'PUT', ...json({ use_published }) }),
};

export const TEST_LINE_NUMBER = '(225) 420-1360';
