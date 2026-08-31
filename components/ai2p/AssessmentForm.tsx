import React, { useState } from 'react';

interface FormState {
  name: string;
  email: string;
  product: string;
  stack: string;
  canShareAccess: boolean;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  product: '',
  stack: '',
  canShareAccess: false,
};

const AssessmentForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.canShareAccess) {
      setError('We need read-only repo or staging access to run an assessment.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://api.snapskill.io/api/v1/analytics/demo-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.name.trim(),
          work_email: form.email.trim(),
          job_title: 'n/a',
          company: form.product.trim() || 'n/a',
          how_did_you_hear: [
            'AI2P assessment request',
            form.stack ? `stack: ${form.stack}` : null,
            form.product ? `built: ${form.product}` : null,
            'repo_access: yes',
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
      <div className="ai2p-form-ok" role="status">
        <h3>Request received</h3>
        <p>
          We will follow up to scope the assessment to your product and send a clear quote
          before any work starts.
        </p>
      </div>
    );
  }

  return (
    <form className="ai2p-form" onSubmit={onSubmit} id="request">
      <div className="ai2p-form-row">
        <div className="ai2p-field">
          <label htmlFor="ai2p-name">Name</label>
          <input
            id="ai2p-name"
            name="name"
            required
            autoComplete="name"
            value={form.name}
            onChange={onChange}
          />
        </div>
        <div className="ai2p-field">
          <label htmlFor="ai2p-email">Work email</label>
          <input
            id="ai2p-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="ai2p-field">
        <label htmlFor="ai2p-product">What did you build?</label>
        <textarea
          id="ai2p-product"
          name="product"
          required
          placeholder="One or two sentences: product, stage, who will use it."
          value={form.product}
          onChange={onChange}
        />
      </div>

      <div className="ai2p-field">
        <label htmlFor="ai2p-stack">Stack (if known)</label>
        <input
          id="ai2p-stack"
          name="stack"
          placeholder="e.g. Next.js, Vercel, Neon, Shopify"
          value={form.stack}
          onChange={onChange}
        />
      </div>

      <label className="ai2p-check">
        <input
          type="checkbox"
          name="canShareAccess"
          checked={form.canShareAccess}
          onChange={onChange}
        />
        <span>
          I can share read-only repo or staging access.
        </span>
      </label>

      {error && <p className="ai2p-form-error">{error}</p>}

      <button className="ai2p-btn ai2p-btn-primary" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Request an assessment'}
      </button>
      <p className="ai2p-form-note">
        Paid assessment. Quote after we see your product.
      </p>
    </form>
  );
};

export default AssessmentForm;
