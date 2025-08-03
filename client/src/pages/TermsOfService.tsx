import React from 'react';
import { PolicyPage } from '@/components/PolicyPage';

const TermsOfService = () => {
  // Fallback content in case database is not available
  const fallbackContent = {
    title: 'Terms of Service',
    subtitle: 'Please read these terms carefully before using 592 Stock',
    updated_at: new Date().toISOString(),
    content: [
      {
        id: 'acceptance-terms',
        emoji: '📋',
        title: 'Acceptance of Terms',
        content: 'By accessing and using 592 Stock, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
        note: 'These terms apply to all visitors, users, and others who access or use our service.'
      },
      {
        id: 'user-accounts',
        emoji: '👤',
        title: 'User Accounts',
        content: 'To use our service, you must:',
        items: [
          'Be at least 13 years old or have parental consent',
          'Provide accurate and complete registration information',
          'Maintain the security of your password and account',
          'Verify your email address to activate full account features',
          'Accept responsibility for all activities under your account'
        ],
        note: 'ℹ️ We recommend using a strong, unique password for your account security.',
        noteType: 'info'
      },
      {
        id: 'service-description',
        emoji: '🛍️',
        title: 'Service Description',
        content: '592 Stock provides a digital marketplace for gaming items including:',
        items: [
          'Virtual items from popular Roblox games',
          'Secure payment processing and instant delivery',
          'Customer support and account management',
          'Balance management and transaction history'
        ]
      },
      {
        id: 'contact-information',
        emoji: '📞',
        title: 'Contact Information',
        content: 'If you have questions about these Terms of Service, please contact us:',
        items: [
          'Use our 24/7 live chat support',
          'Create a support ticket for detailed inquiries',
          'All terms-related questions will be answered promptly'
        ]
      }
    ]
  };

  return <PolicyPage policyType="terms-of-service" fallbackContent={fallbackContent} />;
};

export default TermsOfService;