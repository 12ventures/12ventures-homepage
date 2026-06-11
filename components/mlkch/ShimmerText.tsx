import React from 'react';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
}

const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  className = '',
  as: Tag = 'span',
}) => (
  <Tag className={`text-shimmer ${className}`}>{children}</Tag>
);

export default ShimmerText;
