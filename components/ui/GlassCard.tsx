import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white/70 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl ${className}`}
    >
      {children}
    </div>
  );
};
