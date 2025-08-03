import React from 'react';
import { PolicyPage } from '@/components/PolicyPage';

const PrivacyPolicy = () => {
  // Fallback content in case database is not available
  const fallbackContent = {
    title: 'Privacy Policy',
    subtitle: 'Your privacy is important to us. Learn how we collect, use, and protect your information.',
    updated_at: new Date().toISOString(),
    content: [
      {
        id: 'information-collect',
        emoji: '📋',
        title: 'Information We Collect',
        content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.',
        items: [
          'Account information (email, username, encrypted password)',
          'Payment information (processed securely by our payment partners)',
          'Transaction history and account balances',
          'Support communications and feedback',
          'Usage data and preferences'
        ]
      },
      {
        id: 'how-we-use',
        emoji: '🛡️',
        title: 'How We Use Your Information',
        content: 'We use the information we collect to:',
        items: [
          'Provide and maintain our gaming marketplace service',
          'Process transactions and manage your account',
          'Send important account and service notifications',
          'Provide customer support and respond to inquiries',
          'Improve our service and develop new features',
          'Prevent fraud and ensure platform security'
        ]
      },
      {
        id: 'information-sharing',
        emoji: '🤝',
        title: 'Information Sharing',
        content: 'We do not sell, trade, or otherwise transfer your personal information to third parties except in these limited circumstances:',
        items: [
          'With your explicit consent',
          'To trusted payment processors for transaction handling',
          'When required by law or legal process',
          'To protect our rights, property, or safety',
          'In connection with a business transfer or acquisition'
        ],
        note: '✅ We never sell your personal data to advertisers or marketing companies.',
        noteType: 'success'
      },
      {
        id: 'contact-us',
        emoji: '📧',
        title: 'Contact Us',
        content: 'If you have questions about this Privacy Policy or how we handle your information:',
        items: [
          'Use our 24/7 live chat support',
          'Create a support ticket for privacy-related inquiries',
          'We respond to all privacy questions within 48 hours'
        ]
      }
    ]
  };

  return <PolicyPage policyType="privacy-policy" fallbackContent={fallbackContent} />;
};

export default PrivacyPolicy;