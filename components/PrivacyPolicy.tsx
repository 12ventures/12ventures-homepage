import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBrand } from '../contexts/BrandingContext';

const PrivacyPolicy: React.FC = () => {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-600 mb-4">
              {currentBrand.name} ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
            <p className="text-slate-600 mb-4">
              We may collect information about you in a variety of ways, including:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li><strong>Personal Data:</strong> Name, email address, phone number, and other contact information you provide.</li>
              <li><strong>Usage Data:</strong> Information about how you use our website and services.</li>
              <li><strong>Device Data:</strong> Information about the device you use to access our services.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-600 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
              <li>Provide, operate, and maintain our services</li>
              <li>Improve, personalize, and expand our services</li>
              <li>Communicate with you about updates, offers, and promotions</li>
              <li>Process your requests and transactions</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Data Security</h2>
            <p className="text-slate-600 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Contact Us</h2>
            <p className="text-slate-600 mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-slate-600">
              <strong>Email:</strong> <a href="mailto:privacy@otterworks.io" className="text-brand-600 hover:underline">privacy@otterworks.io</a>
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

export default PrivacyPolicy;

