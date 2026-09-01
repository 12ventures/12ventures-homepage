import React, { useState } from 'react';

interface FormState {
  name: string;
  email: string;
  organization: string;
  role: string;
  website: string;
  focus: string;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  organization: '',
  role: '',
  website: '',
  focus: '',
};

interface ConversationFormProps {
  /** Shown in Snapskill how_did_you_hear for routing. */
  variant?: 'exec' | 'pe';
}

const ConversationForm: React.FC<ConversationFormProps> = ({ variant = 'exec' }) => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const label =
      variant === 'pe'
        ? 'Health Systems PE conversation request'
        : 'Health Systems conversation request';

    try {
      const res = await fetch('https://api.snapskill.io/api/v1/analytics/demo-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.name.trim(),
          work_email: form.email.trim(),
          job_title: form.role.trim() || 'n/a',
          company: form.organization.trim() || 'n/a',
          how_did_you_hear: [
            label,
            form.focus ? `focus: ${form.focus.trim()}` : null,
            form.website ? `website: ${form.website.trim()}` : null,
          ]
            .filter(Boolean)
            .join(' · '),
          source_url:
            typeof window !== 'undefined'
              ? window.location.href
              : variant === 'pe'
                ? 'https://12ventures.io/health-systems/pe'
                : 'https://12ventures.io/health-systems',
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
      <div className="hs-form-ok" role="status" id="request">
        <h3>Request received</h3>
        <p>We will follow up shortly to schedule a conversation.</p>
      </div>
    );
  }

  return (
    <form className="hs-form" onSubmit={onSubmit} id="request">
      <div className="hs-form-row">
        <div className="hs-field">
          <label htmlFor="hs-name">Name</label>
          <input
            id="hs-name"
            name="name"
            required
            autoComplete="name"
            value={form.name}
            onChange={onChange}
          />
        </div>
        <div className="hs-field">
          <label htmlFor="hs-email">Work email</label>
          <input
            id="hs-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="hs-form-row">
        <div className="hs-field">
          <label htmlFor="hs-org">Organization</label>
          <input
            id="hs-org"
            name="organization"
            required
            autoComplete="organization"
            placeholder="Health system or sponsor"
            value={form.organization}
            onChange={onChange}
          />
        </div>
        <div className="hs-field">
          <label htmlFor="hs-role">
            Role <span className="hs-optional">(optional)</span>
          </label>
          <input
            id="hs-role"
            name="role"
            autoComplete="organization-title"
            placeholder="e.g. COO, CFO, Partner"
            value={form.role}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="hs-field">
        <label htmlFor="hs-website">
          Website <span className="hs-optional">(optional)</span>
        </label>
        <input
          id="hs-website"
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="https://"
          value={form.website}
          onChange={onChange}
        />
      </div>

      <div className="hs-field">
        <label htmlFor="hs-focus">
          What should we cover? <span className="hs-optional">(optional)</span>
        </label>
        <textarea
          id="hs-focus"
          name="focus"
          placeholder="Access, workforce, portfolio rollout, or something else."
          value={form.focus}
          onChange={onChange}
        />
      </div>

      {error ? <p className="hs-form-error">{error}</p> : null}

      <button className="hs-btn hs-btn-primary" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Request a conversation'}
      </button>
      <p className="hs-form-note">We reply from hello@12ventures.io.</p>
    </form>
  );
};

export default ConversationForm;
