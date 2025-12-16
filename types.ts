import React from 'react';

export interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  colSpan?: number;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  image: string;
}

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
}