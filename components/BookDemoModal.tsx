import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { openCalendarBooking } from '../utils/calendar';

export interface ValueProp {
  stat: string;
  label: string;
}

interface BookDemoModalProps {
  onClose: () => void;
  product: string;
  tagline: string;
  valueProps: ValueProp[];
  sourceUrl: string;
  email: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  businessEmail: string;
  useCase: string;
}

const BookDemoModal: React.FC<BookDemoModalProps> = ({
  onClose,
  product,
  tagline,
  valueProps,
  sourceUrl,
  email,
}) => {
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', businessEmail: '', useCase: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.snapskill.io/api/v1/analytics/demo-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `${form.firstName} ${form.lastName}`.trim(),
          work_email: form.businessEmail,
          job_title: 'n/a',
          company: 'n/a',
          how_did_you_hear: form.useCase || 'n/a',
          source_url: sourceUrl,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
      openCalendarBooking();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors resize-none';
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  };
  const inputFocusStyle = 'focus:ring-1 focus:ring-blue-400/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Liquid glass modal */}
      <div
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,45,90,0.55) 0%, rgba(6,14,38,0.65) 100%)',
          backdropFilter: 'blur(60px) saturate(180%)',
          WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 0.5px rgba(255,255,255,0.04)',
        }}
      >
        {/* Top specular highlight line */}
        <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2 rounded-full transition-colors text-white/60 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}>
              <ArrowRight className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">You're booked in!</h3>
            <p className="text-white/50 text-sm mb-6">We'll be in touch. Check your calendar for the invite.</p>
            <button onClick={onClose} className="text-blue-400 text-sm hover:text-white transition-colors">Close</button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row">

            {/* Left panel — value props (desktop only) */}
            <div
              className="hidden md:flex flex-col justify-between w-[42%] flex-shrink-0 p-8"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div>
                <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2">
                  OtterWorker I · {product}
                </p>
                <h2 className="text-2xl font-black leading-tight">Book a Demo</h2>
              </div>

              <div className="space-y-3 mt-6">
                {valueProps.map((vp) => (
                  <div
                    key={vp.label}
                    className="flex items-center gap-4 rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-xl font-black text-blue-400 w-16 flex-shrink-0">{vp.stat}</span>
                    <span className="text-xs text-white/60 leading-snug">{vp.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 px-8 pt-14 pb-8">
              {/* Mobile-only header */}
              <div className="md:hidden mb-6">
                <h2 className="text-2xl font-black">Book a Demo</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">First name</label>
                    <input
                      required name="firstName" value={form.firstName} onChange={handleChange}
                      className={`${inputClass} ${inputFocusStyle}`} style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">Last name</label>
                    <input
                      required name="lastName" value={form.lastName} onChange={handleChange}
                      className={`${inputClass} ${inputFocusStyle}`} style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Business email</label>
                  <input
                    required type="email" name="businessEmail" value={form.businessEmail} onChange={handleChange}
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/40 mb-1.5">What problem are you trying to solve?</label>
                  <textarea
                    name="useCase" value={form.useCase} onChange={handleChange} rows={3}
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle}
                  />
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold py-3.5 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-50 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #22d3ee)',
                    color: '#060B14',
                    boxShadow: '0 0 30px rgba(56,189,248,0.35)',
                  }}
                >
                  {loading ? 'Submitting…' : (
                    <>
                      <span>Request a Demo</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDemoModal;
