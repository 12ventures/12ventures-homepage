import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  History,
  Pencil,
  Phone,
  PhoneCall,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  getEditorName,
  LineChange,
  scriptEditor,
  ScriptBlock,
  ScriptDetail,
  ScriptEditorError,
  ScriptLine,
  ScriptOverviewAgent,
  ScriptsOverview,
  ScriptStep,
  setEditorName,
  TEST_LINE_NUMBER,
} from '../../services/scriptEditorService';
import './AgentScripts.css';

export const AGENT_SCRIPTS_BASE = '/o/sarh/voice-ai/agent-scripts';

// ── Plain-language helpers ─────────────────────────────────────────────

const STEP_TITLES: Record<string, string> = {
  TRANSITION: 'Introduction',
  'EXAM TYPE': 'Type of exam',
  'CLOSING STATEMENTS': 'Closing',
  FAREWELL: 'Goodbye',
  'RATING AND FAREWELL': 'Rating and goodbye',
};

function stepTitle(raw: string): string {
  if (/^VALIDATION/i.test(raw)) return 'Check that nothing was missed';
  const clean = raw.replace(/\s*\(.*\)\s*$/, '').trim();
  if (STEP_TITLES[clean]) return STEP_TITLES[clean];
  const lower = clean.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function lineLabel(label: string): string {
  if (label === 'Says') return 'Says';
  if (/^If YES$/i.test(label)) return 'If the caller says yes';
  if (/^If NO$/i.test(label)) return 'If the caller says no';
  if (label.includes('status="success"')) return 'When the number is captured';
  return label.replace(/\bpatient\b/gi, 'caller');
}

const PLACEHOLDER_RE = /\[[a-z_]+\]/g;

function missingPlaceholders(original: string, edited: string): string[] {
  const needed = original.match(PLACEHOLDER_RE) || [];
  return needed.filter((p) => !edited.includes(p));
}

function formatWhen(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function errorMessages(err: unknown): string[] {
  if (err instanceof ScriptEditorError) return err.errors;
  return ['Something went wrong. Please try again.'];
}

// ── Small building blocks ──────────────────────────────────────────────

function Notice({ kind, children }: { kind: 'error' | 'warning' | 'success' | 'info'; children: React.ReactNode }) {
  return <div className={`as-notice as-notice--${kind}`}>{children}</div>;
}

function ErrorList({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <Notice kind="error">
      {errors.map((e) => (
        <p key={e}>{e}</p>
      ))}
    </Notice>
  );
}

function ConfirmDialog(props: {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="as-modal-backdrop" role="dialog" aria-modal="true" aria-label={props.title}>
      <div className="as-modal">
        <div className="as-modal-head">
          <h2>{props.title}</h2>
          <button className="as-icon-btn" onClick={props.onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="as-modal-body">{props.children}</div>
        <div className="as-modal-actions">
          <button className="as-btn as-btn--quiet" onClick={props.onCancel} disabled={props.busy}>
            Cancel
          </button>
          <button
            className={`as-btn ${props.danger ? 'as-btn--danger' : 'as-btn--primary'}`}
            onClick={props.onConfirm}
            disabled={props.busy}
          >
            {props.busy ? 'Working…' : props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangeList({ changes }: { changes: LineChange[] }) {
  if (!changes.length) return <p className="as-muted">No sentences are different.</p>;
  return (
    <ul className="as-changes">
      {changes.map((c) => (
        <li key={c.line_id}>
          <p className="as-changes-step">{stepTitle(c.step)}</p>
          {c.before && (
            <p className="as-changes-before">
              <span>Before</span>
              {c.before}
            </p>
          )}
          <p className="as-changes-after">
            <span>After</span>
            {c.after}
          </p>
        </li>
      ))}
    </ul>
  );
}

function NamePrompt({ onDone }: { onDone: (name: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="as-root">
      <div className="as-name-card">
        <h1>Phone scripts</h1>
        <p>What's your name? It's saved with every change you make, so everyone can see who changed what.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) onDone(value.trim());
          }}
        >
          <input
            className="as-input"
            autoFocus
            value={value}
            maxLength={40}
            placeholder="Your name"
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="as-btn as-btn--primary" type="submit" disabled={!value.trim()}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Overview: call map + live switch ───────────────────────────────────

function LinePills({ agent }: { agent: ScriptOverviewAgent }) {
  return (
    <div className="as-pills">
      <span className="as-pill as-pill--live">
        Hospital line: {agent.live_line ? `Version ${agent.live_line.version}` : 'Built-in script'}
      </span>
      {agent.test_line && <span className="as-pill as-pill--test">Test line: Version {agent.test_line.version}</span>}
      {agent.has_draft && <span className="as-pill as-pill--draft">Unsent changes</span>}
    </div>
  );
}

function AgentCard({ agent, routeLabel }: { agent: ScriptOverviewAgent; routeLabel?: string }) {
  return (
    <Link to={`${AGENT_SCRIPTS_BASE}/${agent.agent_type}`} className="as-agent-card">
      {routeLabel && <span className="as-route-label">{routeLabel}</span>}
      <h3>
        {agent.title}
        <ChevronRight size={20} />
      </h3>
      <p>{agent.description}</p>
      <LinePills agent={agent} />
    </Link>
  );
}

function LiveSwitch({ overview, onChanged }: { overview: ScriptsOverview; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const setting = overview.live_scripts;
  const on = setting.use_published && !setting.hard_off;
  const liveVersions = overview.agents.filter((a) => a.live_line);

  const toggle = async () => {
    setBusy(true);
    setErrors([]);
    try {
      await scriptEditor.setLiveScripts(!setting.use_published);
      setConfirming(false);
      onChanged();
    } catch (err) {
      setErrors(errorMessages(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`as-live-switch ${on ? 'is-on' : ''}`}>
      <ShieldCheck size={26} />
      <div className="as-live-switch-text">
        <h2>{on ? 'The hospital line is using your edited scripts' : 'The hospital line is using the built-in scripts'}</h2>
        <p>
          {setting.hard_off
            ? 'Edited scripts are switched off on the server, so callers always hear the built-in scripts.'
            : on
              ? 'Parts of the call without a live version still use the built-in script.'
              : 'Edits only reach real callers after you make them live and switch this on.'}
        </p>
        <ErrorList errors={errors} />
      </div>
      {!setting.hard_off && (
        <button className={`as-btn ${on ? 'as-btn--quiet' : 'as-btn--primary'}`} onClick={() => setConfirming(true)}>
          {on ? 'Switch back to built-in scripts' : 'Use edited scripts'}
        </button>
      )}
      {confirming && (
        <ConfirmDialog
          title={on ? 'Switch back to the built-in scripts?' : 'Use your edited scripts on the hospital line?'}
          confirmLabel={on ? 'Yes, switch back' : 'Yes, use edited scripts'}
          danger={!on}
          busy={busy}
          onConfirm={toggle}
          onCancel={() => setConfirming(false)}
        >
          {on ? (
            <p>New calls will use the built-in scripts within about 30 seconds. Calls already in progress aren't affected.</p>
          ) : (
            <>
              <p>New calls will start using these within about 30 seconds:</p>
              <ul className="as-plain-list">
                {liveVersions.length ? (
                  liveVersions.map((a) => (
                    <li key={a.agent_type}>
                      {a.title}: Version {a.live_line?.version}
                    </li>
                  ))
                ) : (
                  <li>Nothing has been made live yet, so callers will hear no difference.</li>
                )}
              </ul>
              <p>Everything else stays on the built-in script. You can switch back at any time.</p>
            </>
          )}
        </ConfirmDialog>
      )}
    </section>
  );
}

function Overview() {
  const [overview, setOverview] = useState<ScriptsOverview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setOverview(await scriptEditor.overview());
      setErrors([]);
    } catch (err) {
      setErrors(errorMessages(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!overview) {
    return errors.length ? <ErrorList errors={errors} /> : <p className="as-muted">Loading…</p>;
  }

  const byType = Object.fromEntries(overview.agents.map((a) => [a.agent_type, a]));
  const first = byType[overview.flow.initial_agent];
  const routed = overview.flow.routes.map((r) => ({ ...r, agent: byType[r.to] })).filter((r) => r.agent);
  const others = overview.agents.filter(
    (a) => a.agent_type !== overview.flow.initial_agent && !overview.flow.routes.some((r) => r.to === a.agent_type),
  );

  return (
    <>
      <header className="as-header">
        <h1>Phone scripts</h1>
        <p>
          What the phone assistant says to callers. Change a sentence, try it on the test line, then make it live.
        </p>
      </header>

      <LiveSwitch overview={overview} onChanged={load} />

      <section className="as-map" aria-label="How a call flows">
        <h2 className="as-section-title">How a call flows</h2>
        <div className="as-map-start">
          <Phone size={20} /> A caller dials the hospital line
        </div>
        <ArrowDown className="as-map-arrow" size={28} />
        {first && <AgentCard agent={first} />}
        <ArrowDown className="as-map-arrow" size={28} />
        <div className="as-map-branches">
          {routed.map((r) => (
            <AgentCard key={r.to} agent={r.agent} routeLabel={r.label} />
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="as-section-title">Other scripts</h2>
          <div className="as-map-branches">
            {others.map((a) => (
              <AgentCard key={a.agent_type} agent={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ── One script ─────────────────────────────────────────────────────────

function renderTemplate(block: ScriptBlock, lines: Record<string, string>): React.ReactNode[] {
  const parts = block.template.split(/(\{\{line:[A-Za-z0-9_.\-]+\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/^\{\{line:(.+)\}\}$/);
    return m ? (
      <mark key={i} className="as-tpl-line">
        {lines[m[1]] ?? ''}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    );
  });
}

function SentenceRow(props: {
  line: ScriptLine;
  pending?: string;
  onChange: (text: string | null) => void;
}) {
  const { line, pending } = props;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(pending ?? line.text);
  const [problem, setProblem] = useState('');
  const current = pending ?? line.text;

  const done = () => {
    const text = value.replace(/\s+/g, ' ').trim();
    if (!text) return setProblem("The sentence can't be empty.");
    if (text.includes('"')) return setProblem('Please use single quotes (\') instead of double quotes (").');
    const missing = missingPlaceholders(line.text, text);
    if (missing.length) return setProblem(`Keep ${missing.join(', ')} in the sentence. The assistant fills it in.`);
    setProblem('');
    setEditing(false);
    props.onChange(text === line.text ? null : text);
  };

  return (
    <li className={`as-sentence ${pending !== undefined ? 'is-changed' : ''}`}>
      <span className="as-sentence-label">{lineLabel(line.label)}</span>
      {editing ? (
        <div className="as-sentence-edit">
          <textarea
            className="as-input"
            autoFocus
            rows={Math.min(8, Math.max(2, Math.ceil(value.length / 70)))}
            maxLength={600}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setProblem('');
            }}
          />
          {(line.text.match(PLACEHOLDER_RE) || []).length > 0 && (
            <p className="as-hint">Words in [brackets] are filled in by the assistant. Keep them.</p>
          )}
          {problem && <p className="as-field-error">{problem}</p>}
          <div className="as-row">
            <button className="as-btn as-btn--primary as-btn--small" onClick={done}>
              <Check size={16} /> Done
            </button>
            <button
              className="as-btn as-btn--quiet as-btn--small"
              onClick={() => {
                setValue(current);
                setProblem('');
                setEditing(false);
              }}
            >
              Cancel
            </button>
            {pending !== undefined && (
              <button
                className="as-btn as-btn--quiet as-btn--small"
                onClick={() => {
                  setValue(line.text);
                  setEditing(false);
                  props.onChange(null);
                }}
              >
                <RotateCcw size={16} /> Undo this change
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="as-sentence-view">
          <p>“{current}”</p>
          <button
            className="as-btn as-btn--quiet as-btn--small"
            onClick={() => {
              setValue(current);
              setEditing(true);
            }}
          >
            <Pencil size={16} /> Edit
          </button>
        </div>
      )}
    </li>
  );
}

function StepCard(props: {
  step: ScriptStep;
  block?: ScriptBlock;
  pending: Record<string, string>;
  lineTexts: Record<string, string>;
  onChange: (lineId: string, text: string | null) => void;
}) {
  const { step } = props;
  const [showFull, setShowFull] = useState(false);
  return (
    <li className="as-step">
      <div className="as-step-number">{step.number}</div>
      <div className="as-step-body">
        <h3>{stepTitle(step.title)}</h3>
        {step.saves.length > 0 && <p className="as-step-saves">Saves: {step.saves.map((s) => s.label).join(', ')}</p>}
        {step.lines.length ? (
          <ul className="as-sentences">
            {step.lines.map((line) => (
              <SentenceRow
                key={line.id}
                line={line}
                pending={props.pending[line.id]}
                onChange={(text) => props.onChange(line.id, text)}
              />
            ))}
          </ul>
        ) : (
          <p className="as-muted">The assistant doesn't say a fixed sentence in this step.</p>
        )}
        {props.block && (
          <>
            <button className="as-link-btn" onClick={() => setShowFull((v) => !v)}>
              {showFull ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {showFull ? 'Hide' : 'Show'} the full instructions for this step
            </button>
            {showFull && <pre className="as-template">{renderTemplate(props.block, props.lineTexts)}</pre>}
          </>
        )}
      </div>
    </li>
  );
}

function ScriptView({ agentType }: { agentType: string }) {
  const [detail, setDetail] = useState<ScriptDetail | null>(null);
  const [liveScriptsOn, setLiveScriptsOn] = useState(false);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<null | 'send' | 'live' | 'discard' | { rollback: number | 'built_in' }>(null);
  const [note, setNote] = useState('');
  const [showRules, setShowRules] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, o] = await Promise.all([scriptEditor.get(agentType), scriptEditor.overview()]);
      setDetail(d);
      setWarnings(d.warnings);
      setLiveScriptsOn(o.live_scripts.use_published && !o.live_scripts.hard_off);
      setErrors([]);
    } catch (err) {
      setErrors(errorMessages(err));
    }
  }, [agentType]);

  useEffect(() => {
    load();
  }, [load]);

  // While a test-line version is waiting for its first completed test call,
  // check again every 20s so "Make live" unlocks on its own.
  const waitingForTest =
    !!detail?.test_line && (detail.test_calls?.completed_test_calls ?? 0) < 1 && detail.showing === 'test_line';
  useEffect(() => {
    if (!waitingForTest) return;
    const id = window.setInterval(async () => {
      try {
        const evidence = await scriptEditor.testCalls(agentType);
        setDetail((d) => (d ? { ...d, test_calls: evidence } : d));
      } catch {
        /* keep waiting */
      }
    }, 20000);
    return () => window.clearInterval(id);
  }, [waitingForTest, agentType]);

  const blocksById = useMemo(
    () => Object.fromEntries((detail?.structure.blocks || []).map((b) => [b.id, b])),
    [detail],
  );
  const lineTexts = useMemo(() => {
    const out: Record<string, string> = {};
    detail?.steps.forEach((s) => s.lines.forEach((l) => (out[l.id] = pending[l.id] ?? l.text)));
    return out;
  }, [detail, pending]);

  if (!detail) {
    return errors.length ? <ErrorList errors={errors} /> : <p className="as-muted">Loading…</p>;
  }

  const pendingCount = Object.keys(pending).length;
  const hasDraft = detail.showing === 'draft';
  const testVersion = detail.test_line?.version;
  const liveVersion = detail.live_line?.version;
  const completed = detail.test_calls?.completed_test_calls ?? 0;
  const canSend = pendingCount === 0 && hasDraft;
  const canMakeLive =
    pendingCount === 0 && !hasDraft && !!testVersion && completed >= 1 && testVersion !== liveVersion;

  const run = async (action: () => Promise<string | void>) => {
    setBusy(true);
    setErrors([]);
    setMessage('');
    try {
      const msg = await action();
      if (msg) setMessage(msg);
      setDialog(null);
      await load();
    } catch (err) {
      setErrors(errorMessages(err));
      if (err instanceof ScriptEditorError && err.warnings.length) setWarnings(err.warnings);
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  const saveChanges = () =>
    run(async () => {
      const result = await scriptEditor.saveLines(agentType, pending);
      setPending({});
      setWarnings(result.warnings);
      return 'Your changes are saved. Next, send them to the test line to hear them.';
    });

  const steps = detail.steps;
  const rulesBlocks = detail.structure.blocks.filter((b) => b.kind !== 'step');

  return (
    <>
      <Link to={AGENT_SCRIPTS_BASE} className="as-back">
        <ArrowLeft size={18} /> All phone scripts
      </Link>
      <header className="as-header">
        <h1>{detail.title}</h1>
        <p>{detail.description}</p>
      </header>

      <section className="as-status">
        <div className={`as-status-box ${hasDraft || pendingCount ? 'is-active' : ''}`}>
          <p className="as-status-label">Your changes</p>
          <p className="as-status-value">
            {pendingCount
              ? `${pendingCount} not saved yet`
              : hasDraft
                ? `Saved, not on the test line yet`
                : 'None'}
          </p>
        </div>
        <div className={`as-status-box ${testVersion ? 'is-active' : ''}`}>
          <p className="as-status-label">Test line {TEST_LINE_NUMBER}</p>
          <p className="as-status-value">{testVersion ? `Version ${testVersion}` : 'Same as the hospital line'}</p>
          {testVersion && (
            <p className="as-status-sub">
              {completed >= 1
                ? `Tested: ${completed} finished call${completed === 1 ? '' : 's'}`
                : 'Not tested yet. Call the test line and finish a call.'}
            </p>
          )}
        </div>
        <div className="as-status-box">
          <p className="as-status-label">Hospital line</p>
          <p className="as-status-value">{liveVersion ? `Version ${liveVersion}` : 'Built-in script'}</p>
          {liveVersion && !liveScriptsOn && (
            <p className="as-status-sub">Edited scripts are switched off, so callers hear the built-in script.</p>
          )}
        </div>
      </section>

      <ErrorList errors={errors} />
      {message && <Notice kind="success">{message}</Notice>}
      {warnings.length > 0 && (
        <Notice kind="warning">
          <p>
            <AlertTriangle size={16} /> Please check:
          </p>
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </Notice>
      )}

      {detail.changes_vs_live.length > 0 && (
        <details className="as-diff">
          <summary>
            {detail.changes_vs_live.length} sentence{detail.changes_vs_live.length === 1 ? ' is' : 's are'} different
            from the hospital line
          </summary>
          <ChangeList changes={detail.changes_vs_live} />
        </details>
      )}

      <h2 className="as-section-title">The call, step by step</h2>
      <ol className="as-steps">
        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            block={blocksById[step.id]}
            pending={pending}
            lineTexts={lineTexts}
            onChange={(lineId, text) =>
              setPending((p) => {
                const next = { ...p };
                if (text === null) delete next[lineId];
                else next[lineId] = text;
                return next;
              })
            }
          />
        ))}
      </ol>

      <section className="as-rules">
        <button className="as-link-btn" onClick={() => setShowRules((v) => !v)}>
          {showRules ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {showRules ? 'Hide' : 'Show'} the general rules the assistant follows (read only)
        </button>
        {showRules &&
          rulesBlocks.map((b) => (
            <pre key={b.id} className="as-template">
              {renderTemplate(b, lineTexts)}
            </pre>
          ))}
      </section>

      <section className="as-history">
        <h2 className="as-section-title">
          <History size={18} /> History
        </h2>
        {detail.versions.length === 0 ? (
          <p className="as-muted">No versions yet. Everything is the built-in script.</p>
        ) : (
          <ul>
            {detail.versions.map((v) => (
              <li key={v.version}>
                <div>
                  <strong>Version {v.version}</strong>
                  {v.version === liveVersion && <span className="as-pill as-pill--live">On hospital line</span>}
                  {v.version === testVersion && <span className="as-pill as-pill--test">On test line</span>}
                  <p className="as-muted">
                    {[v.note, v.created_by, formatWhen(v.created_at)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {v.was_live && v.version !== liveVersion && (
                  <button className="as-btn as-btn--quiet as-btn--small" onClick={() => setDialog({ rollback: v.version })}>
                    <RotateCcw size={16} /> Put back on hospital line
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="as-row">
          {liveVersion && (
            <button className="as-btn as-btn--quiet as-btn--small" onClick={() => setDialog({ rollback: 'built_in' })}>
              <RotateCcw size={16} /> Hospital line back to the built-in script
            </button>
          )}
          {hasDraft && (
            <button className="as-btn as-btn--quiet as-btn--small" onClick={() => setDialog('discard')}>
              <X size={16} /> Throw away saved changes
            </button>
          )}
        </div>
      </section>

      <div className="as-bar" role="region" aria-label="Save and publish">
        <div className={`as-bar-step ${pendingCount ? 'is-ready' : ''}`}>
          <span className="as-bar-num">1</span>
          <button className="as-btn as-btn--primary" disabled={!pendingCount || busy} onClick={saveChanges}>
            <Check size={18} /> Save changes
          </button>
          <span className="as-bar-hint">{pendingCount ? `${pendingCount} unsaved` : 'Edit a sentence first'}</span>
        </div>
        <div className={`as-bar-step ${canSend ? 'is-ready' : ''}`}>
          <span className="as-bar-num">2</span>
          <button className="as-btn as-btn--primary" disabled={!canSend || busy} onClick={() => setDialog('send')}>
            <Send size={18} /> Send to test line
          </button>
          <span className="as-bar-hint">
            {pendingCount ? 'Save first' : hasDraft ? 'Then call the test line' : 'No saved changes'}
          </span>
        </div>
        <div className={`as-bar-step ${canMakeLive ? 'is-ready' : ''}`}>
          <span className="as-bar-num">3</span>
          <button className="as-btn as-btn--danger" disabled={!canMakeLive || busy} onClick={() => setDialog('live')}>
            <PhoneCall size={18} /> Make live
          </button>
          <span className="as-bar-hint">
            {canMakeLive
              ? `Version ${testVersion} tested`
              : hasDraft || pendingCount
                ? 'Send to test line first'
                : testVersion && testVersion === liveVersion
                  ? 'Already live'
                  : testVersion
                    ? 'Make a test call first'
                    : 'Nothing to make live'}
          </span>
        </div>
      </div>

      {dialog === 'send' && (
        <ConfirmDialog
          title="Send to the test line?"
          confirmLabel="Send to test line"
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            run(async () => {
              const r = await scriptEditor.sendToTest(agentType, note);
              setNote('');
              return `Version ${r.version} is on the test line. Call ${TEST_LINE_NUMBER} and go through a whole call to hear it.`;
            })
          }
        >
          <p>Real callers won't hear this. Only calls to the test line {TEST_LINE_NUMBER} will.</p>
          <ChangeList changes={detail.changes_vs_live} />
          <label className="as-label">
            What did you change? (optional)
            <input className="as-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
          </label>
        </ConfirmDialog>
      )}

      {dialog === 'live' && testVersion && (
        <ConfirmDialog
          title={`Make version ${testVersion} live on the hospital line?`}
          confirmLabel="Yes, make it live"
          danger
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() => run(async () => (await scriptEditor.makeLive(agentType, testVersion)).message)}
        >
          <p>
            {liveScriptsOn
              ? 'New calls to the hospital line will hear this within about 30 seconds. Calls in progress are not affected.'
              : 'Edited scripts are switched off, so callers keep hearing the built-in script until you switch them on.'}
          </p>
          <ChangeList changes={detail.changes_vs_live} />
          <p className="as-muted">You can undo this from the History section at any time.</p>
        </ConfirmDialog>
      )}

      {dialog === 'discard' && (
        <ConfirmDialog
          title="Throw away your saved changes?"
          confirmLabel="Throw away"
          danger
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            run(async () => {
              await scriptEditor.discardDraft(agentType);
              setPending({});
              return 'Your saved changes were thrown away.';
            })
          }
        >
          <p>This removes changes you haven't sent to the test line. The test line and hospital line don't change.</p>
        </ConfirmDialog>
      )}

      {dialog && typeof dialog === 'object' && (
        <ConfirmDialog
          title={
            dialog.rollback === 'built_in'
              ? 'Put the hospital line back on the built-in script?'
              : `Put version ${dialog.rollback} back on the hospital line?`
          }
          confirmLabel="Yes, put it back"
          danger
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            const target = dialog.rollback;
            run(async () => (await scriptEditor.rollback(agentType, target)).message);
          }}
        >
          <p>New calls to the hospital line will use it within about 30 seconds.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

const AgentScripts: React.FC = () => {
  const { agentType } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState(getEditorName());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [agentType]);

  if (!name) {
    return (
      <NamePrompt
        onDone={(n) => {
          setEditorName(n);
          setName(n);
        }}
      />
    );
  }

  return (
    <div className="as-root">
      <div className="as-container">
        <div className="as-topline">
          <span>SARH Voice AI</span>
          <button
            className="as-link-btn"
            onClick={() => {
              setEditorName('');
              setName('');
              navigate(AGENT_SCRIPTS_BASE);
            }}
          >
            Editing as {name} · change
          </button>
        </div>
        {agentType ? <ScriptView key={agentType} agentType={agentType} /> : <Overview />}
      </div>
    </div>
  );
};

export default AgentScripts;
