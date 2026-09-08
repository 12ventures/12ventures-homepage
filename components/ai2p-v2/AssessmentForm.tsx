import React, { useState } from 'react';

interface FormState {
  name: string;
  email: string;
  company: string;
  builtWith: string;
  githubUrl: string;
  blocking: string;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  company: '',
  builtWith: '',
  githubUrl: '',
  blocking: '',
};

const BUILT_WITH_OPTIONS = ['Cursor', 'Claude Code', 'Lovable', 'Replit', 'Bolt', 'Other'];

const AssessmentForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('https://api.snapskill.io/api/v1/analytics/demo-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.name.trim(),
          work_email: form.email.trim(),
          job_title: 'n/a',
          company: form.company.trim() || 'n/a',
          how_did_you_hear: [
            'AI2P assessment request',
            form.builtWith ? `built with: ${form.builtWith}` : null,
            form.githubUrl ? `github: ${form.githubUrl.trim()}` : null,
            form.blocking ? `blocking: ${form.blocking.trim()}` : null,
          ]
            .filter(Boolean)
            .join(' · '),
          source_url:
            typeof window !== 'undefined'
              ? window.location.href
              : 'https://12ventures.io/ai-2-production',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Email hello@12ventures.io and we will follow up.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="ai2p-v2-form-ok" role="status">
        <h3>Request received</h3>
        <p>
          We will follow up to scope the assessment to your product and send a clear quote
          before any work starts.
        </p>
      </div>
    );
  }

  return (
    <form className="ai2p-v2-form" onSubmit={onSubmit} id="request">
      <div className="ai2p-v2-form-row">
        <div className="ai2p-v2-field">
          <label htmlFor="ai2p-v2-name">Name</label>
          <input
            id="ai2p-v2-name"
            name="name"
            required
            autoComplete="name"
            value={form.name}
            onChange={onChange}
          />
        </div>
        <div className="ai2p-v2-field">
          <label htmlFor="ai2p-v2-email">Work email</label>
          <input
            id="ai2p-v2-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="ai2p-v2-form-row">
        <div className="ai2p-v2-field">
          <label htmlFor="ai2p-v2-company">Company</label>
          <input
            id="ai2p-v2-company"
            name="company"
            required
            autoComplete="organization"
            value={form.company}
            onChange={onChange}
          />
        </div>
        <div className="ai2p-v2-field">
          <label htmlFor="ai2p-v2-built-with">What did you build it with?</label>
          <select
            id="ai2p-v2-built-with"
            name="builtWith"
            required
            value={form.builtWith}
            onChange={onChange}
          >
            <option value="" disabled>
              Select one
            </option>
            {BUILT_WITH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ai2p-v2-field">
        <label htmlFor="ai2p-v2-github">
          GitHub URL <span className="ai2p-v2-optional">(optional)</span>
        </label>
        <input
          id="ai2p-v2-github"
          name="githubUrl"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="https://github.com/your-org/your-repo"
          value={form.githubUrl}
          onChange={onChange}
        />
      </div>

      <div className="ai2p-v2-field">
        <label htmlFor="ai2p-v2-blocking">What&rsquo;s blocking production?</label>
        <textarea
          id="ai2p-v2-blocking"
          name="blocking"
          required
          placeholder="One or two sentences: what's making you hesitate to launch."
          value={form.blocking}
          onChange={onChange}
        />
      </div>

      {error && <p className="ai2p-v2-form-error">{error}</p>}

      <button className="ai2p-v2-btn ai2p-v2-btn-primary" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Start the conversation'}
      </button>
      <p className="ai2p-v2-form-note">
        Paid assessment. Quote after we see your repo, stage, and stack.
      </p>
    </form>
  );
};

export default AssessmentForm;
