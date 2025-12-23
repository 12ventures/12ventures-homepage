import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';
import { openCalendarBooking } from '../utils/calendar';

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasSubmitted: boolean;
  onSubmitted: () => void;
}

const LeadMagnetModal: React.FC<LeadMagnetModalProps> = ({ isOpen, onClose, hasSubmitted, onSubmitted }) => {
  const { currentBrand } = useBrand();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.snapskill.io/api/v1/analytics/demo-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: 'n/a',
          work_email: email,
          job_title: 'n/a',
          company: 'n/a',
          how_did_you_hear: 'n/a',
          source_url: `${currentBrand.name} Landing Page`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      onSubmitted();
      openCalendarBooking();
      onClose();
    } catch (err) {
      console.error('Error submitting lead:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="relative">
        <input
          type="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-16 px-6 rounded-2xl bg-white/10 border border-white/20 text-white text-lg placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-16 rounded-2xl bg-white text-slate-900 text-2xl font-black uppercase tracking-wider hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? 'Processing...' : 'SHOW ME HOW'}
      </button>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      <button
        type="button"
        onClick={onClose}
        className="block mt-6 mx-auto text-white/50 text-lg font-bold underline hover:text-white/80 transition-colors decoration-white/30 underline-offset-4 italic"
      >
        No thanks, I don't want an empowered team
      </button>
    </form>
  );

  const renderSuccess = () => (
    <div className="w-full max-w-md space-y-6">
      <h3 className="text-3xl font-bold text-white tracking-tight">
        Thank you for joining {currentBrand.name}!
      </h3>
      <p className="text-white/70 text-lg">
        We’ll keep you updated and keep helping you strengthen your team with fresh stories, ideas, and demo dates.
      </p>
      <button
        type="button"
        onClick={() => {
          openCalendarBooking();
          onClose();
        }}
        className="w-full h-16 rounded-2xl bg-brand-500 text-white text-xl font-semibold uppercase tracking-wide hover:bg-brand-400 transition-all flex items-center justify-center"
      >
        Schedule a Demo
      </button>
      <button
        type="button"
        onClick={onClose}
        className="text-white/50 text-sm font-semibold underline decoration-white/30 hover:text-white transition-colors underline-offset-4"
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-500" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[40px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="relative px-8 py-16 sm:px-12 sm:py-20 text-center flex flex-col items-center">
          
          {/* Decorative Logo / Icon */}
          <div className="mb-10 opacity-80">
            <svg viewBox="0 0 100 20" className="h-6 w-auto fill-white">
              <path d="M0 0h5v20H0zM15 0h5v20h-5zM30 0h5v20h-5zM45 0h5v20h-45zM60 0h5v20h-5zM75 0h5v20h-5zM90 0h5v20h-5z" opacity=".2"/>
              <path d="M0 0h5v20H0zM15 0h5v20h-5zM30 0h5v20h-5zM45 0h5v20h-5zM60 0h5v20h-5zM75 0h5v20h-5zM90 0h5v20h-5z" transform="skewX(-20)"/>
            </svg>
          </div>

          <h2 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tight mb-6 leading-[0.9]">
            EMPOWER <br />
            <span className="text-white/90">YOUR PEOPLE</span>
          </h2>

          {hasSubmitted ? renderSuccess() : renderForm()}

          <p className="mt-12 text-white/30 text-xs max-w-md">
            By signing up, you agree to receive emails. See our privacy policy for more details.
          </p>
        </div>

        {/* Inner background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-brand-500/20 to-accent-purple/20 pointer-events-none -z-10" />
      </div>
    </div>
  );
};

export default LeadMagnetModal;

