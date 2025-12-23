import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';

const TermsOfService: React.FC = () => {
  const { currentBrand } = useBrand();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 mb-4">
              By accessing or using {currentBrand.name}'s website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Description of Service</h2>
            <p className="text-slate-600 mb-4">
              {currentBrand.name} provides a platform for healthcare workforce training, onboarding, and professional development. Our services are designed to help healthcare organizations improve staff retention and training efficiency.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. User Responsibilities</h2>
            <p className="text-slate-600 mb-4">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Provide accurate information when creating an account or submitting forms</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Use our services in compliance with all applicable laws and regulations</li>
              <li>Not misuse or attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Intellectual Property</h2>
            <p className="text-slate-600 mb-4">
              All content, features, and functionality of our services are owned by {currentBrand.name} and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Limitation of Liability</h2>
            <p className="text-slate-600 mb-4">
              {currentBrand.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Changes to Terms</h2>
            <p className="text-slate-600 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Contact Us</h2>
            <p className="text-slate-600 mb-4">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-slate-600">
              <strong>Email:</strong> <a href="mailto:legal@otterworks.io" className="text-brand-600 hover:underline">legal@otterworks.io</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          © {currentYear} {currentBrand.name} Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;

