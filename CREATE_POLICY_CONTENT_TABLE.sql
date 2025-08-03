-- 📋 CREATE POLICY CONTENT TABLE FOR ADMIN EDITING
-- This enables admins to edit privacy policy and terms of service content

-- 1. Drop table if exists to start fresh
DROP TABLE IF EXISTS policy_content CASCADE;

-- 2. Create policy_content table
CREATE TABLE policy_content (
    id BIGSERIAL PRIMARY KEY,
    policy_type VARCHAR(50) NOT NULL UNIQUE, -- 'privacy-policy' or 'terms-of-service'
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    content JSONB NOT NULL, -- Store sections as JSON array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255) -- email of admin who last updated
);

-- 3. Create indexes for performance
CREATE INDEX idx_policy_content_type ON policy_content(policy_type);
CREATE INDEX idx_policy_content_updated_at ON policy_content(updated_at);

-- 4. Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_policy_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_policy_content_timestamp
    BEFORE UPDATE ON policy_content
    FOR EACH ROW
    EXECUTE FUNCTION update_policy_content_timestamp();

-- 5. Insert default privacy policy content
INSERT INTO policy_content (policy_type, title, subtitle, content) VALUES (
    'privacy-policy',
    'Privacy Policy',
    'Your privacy is important to us. Learn how we collect, use, and protect your information.',
    '[
        {
            "id": "information-collect",
            "emoji": "📋",
            "title": "Information We Collect",
            "content": "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.",
            "items": [
                "Account information (email, username, encrypted password)",
                "Payment information (processed securely by our payment partners)",
                "Transaction history and account balances",
                "Support communications and feedback",
                "Usage data and preferences"
            ]
        },
        {
            "id": "how-we-use",
            "emoji": "🛡️",
            "title": "How We Use Your Information",
            "content": "We use the information we collect to:",
            "items": [
                "Provide and maintain our gaming marketplace service",
                "Process transactions and manage your account",
                "Send important account and service notifications",
                "Provide customer support and respond to inquiries",
                "Improve our service and develop new features",
                "Prevent fraud and ensure platform security"
            ]
        },
        {
            "id": "information-sharing",
            "emoji": "🤝",
            "title": "Information Sharing",
            "content": "We do not sell, trade, or otherwise transfer your personal information to third parties except in these limited circumstances:",
            "items": [
                "With your explicit consent",
                "To trusted payment processors for transaction handling",
                "When required by law or legal process",
                "To protect our rights, property, or safety",
                "In connection with a business transfer or acquisition"
            ],
            "note": "✅ We never sell your personal data to advertisers or marketing companies.",
            "noteType": "success"
        },
        {
            "id": "data-security",
            "emoji": "🔐",
            "title": "Data Security",
            "content": "We implement various security measures to protect your information:",
            "items": [
                "SSL encryption for all data transmission",
                "Secure password hashing and storage",
                "Regular security audits and monitoring",
                "Limited access to personal data by authorized personnel only",
                "Secure cloud infrastructure with backup systems"
            ],
            "note": "🔒 Your payment information is processed by PCI-compliant payment processors and never stored on our servers.",
            "noteType": "info"
        },
        {
            "id": "cookies-tracking",
            "emoji": "🍪",
            "title": "Cookies and Tracking",
            "content": "We use cookies and similar technologies to:",
            "items": [
                "Keep you logged in to your account",
                "Remember your preferences and settings",
                "Analyze usage patterns to improve our service",
                "Ensure security and prevent fraud"
            ]
        },
        {
            "id": "your-rights",
            "emoji": "👤",
            "title": "Your Rights and Choices",
            "content": "You have the right to:",
            "items": [
                "Access and review your personal information",
                "Correct inaccurate or incomplete data",
                "Request deletion of your account and data",
                "Opt out of non-essential communications",
                "Export your data in a portable format",
                "File a complaint with relevant authorities"
            ]
        },
        {
            "id": "children-privacy",
            "emoji": "👶",
            "title": "Children\'s Privacy",
            "content": "Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13 without parental consent.",
            "items": [
                "Users must be 13+ or have verified parental consent",
                "Parents can review and delete their child\'s information",
                "We comply with COPPA requirements for child privacy"
            ]
        },
        {
            "id": "policy-updates",
            "emoji": "🔄",
            "title": "Policy Updates",
            "content": "We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the \"Last updated\" date."
        },
        {
            "id": "contact-us",
            "emoji": "📧",
            "title": "Contact Us",
            "content": "If you have questions about this Privacy Policy or how we handle your information:",
            "items": [
                "Use our 24/7 live chat support",
                "Create a support ticket for privacy-related inquiries",
                "We respond to all privacy questions within 48 hours"
            ]
        }
    ]'::jsonb
);

-- 6. Insert default terms of service content
INSERT INTO policy_content (policy_type, title, subtitle, content) VALUES (
    'terms-of-service',
    'Terms of Service',
    'Please read these terms carefully before using 592 Stock',
    '[
        {
            "id": "acceptance-terms",
            "emoji": "📋",
            "title": "Acceptance of Terms",
            "content": "By accessing and using 592 Stock, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
            "note": "These terms apply to all visitors, users, and others who access or use our service."
        },
        {
            "id": "user-accounts",
            "emoji": "👤",
            "title": "User Accounts",
            "content": "To use our service, you must:",
            "items": [
                "Be at least 13 years old or have parental consent",
                "Provide accurate and complete registration information",
                "Maintain the security of your password and account",
                "Verify your email address to activate full account features",
                "Accept responsibility for all activities under your account"
            ],
            "note": "ℹ️ We recommend using a strong, unique password for your account security.",
            "noteType": "info"
        },
        {
            "id": "service-description",
            "emoji": "🛍️",
            "title": "Service Description",
            "content": "592 Stock provides a digital marketplace for gaming items including:",
            "items": [
                "Virtual items from popular Roblox games",
                "Secure payment processing and instant delivery",
                "Customer support and account management",
                "Balance management and transaction history"
            ]
        },
        {
            "id": "user-responsibilities",
            "emoji": "⚖️",
            "title": "User Responsibilities",
            "content": "As a user of 592 Stock, you agree to:",
            "items": [
                "Use the service only for lawful purposes",
                "Not attempt to circumvent security measures",
                "Not engage in fraudulent or deceptive practices",
                "Respect the intellectual property rights of others",
                "Not share your account credentials with others",
                "Report any suspicious activity or security breaches"
            ]
        },
        {
            "id": "prohibited-activities",
            "emoji": "🚫",
            "title": "Prohibited Activities",
            "content": "The following activities are strictly prohibited:",
            "items": [
                "Attempting to hack, exploit, or damage our systems",
                "Using automated tools to access our service (bots, scripts)",
                "Creating multiple accounts to circumvent restrictions",
                "Engaging in money laundering or illegal financial activities",
                "Harassing other users or our support staff",
                "Posting or sharing inappropriate content"
            ],
            "note": "⚠️ Violation of these terms may result in account suspension or termination.",
            "noteType": "warning"
        },
        {
            "id": "payment-terms",
            "emoji": "💳",
            "title": "Payment Terms",
            "content": "Regarding payments and transactions:",
            "items": [
                "All prices are displayed in USD unless otherwise noted",
                "Payment processing is handled securely by our partners",
                "Chargebacks may result in account restrictions",
                "Account balances are non-transferable between users",
                "We reserve the right to verify payment sources"
            ]
        },
        {
            "id": "privacy-data",
            "emoji": "🔒",
            "title": "Privacy & Data",
            "content": "Your privacy is important to us:",
            "items": [
                "We collect only necessary information to provide our service",
                "Your personal data is protected and never sold to third parties",
                "We use encryption to secure sensitive information",
                "You can request deletion of your account and data",
                "We comply with applicable data protection regulations"
            ]
        },
        {
            "id": "disclaimers-limitations",
            "emoji": "⚠️",
            "title": "Disclaimers & Limitations",
            "content": "Important legal information:",
            "items": [
                "Our service is provided \"as is\" without warranties",
                "We are not liable for any losses from service interruptions",
                "Digital items have no real-world monetary value",
                "Game publishers may change their terms affecting our service",
                "Our liability is limited to the amount paid for services"
            ]
        },
        {
            "id": "contact-information",
            "emoji": "📞",
            "title": "Contact Information",
            "content": "If you have questions about these Terms of Service, please contact us:",
            "items": [
                "Use our 24/7 live chat support",
                "Create a support ticket for detailed inquiries",
                "All terms-related questions will be answered promptly"
            ]
        }
    ]'::jsonb
);

-- 7. Enable RLS (Row Level Security)
ALTER TABLE policy_content ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for admin access
CREATE POLICY "Admin full access to policy content" ON policy_content
    FOR ALL USING (
        auth.email() IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- 9. Create policy for public read access
CREATE POLICY "Public read access to policy content" ON policy_content
    FOR SELECT USING (true);

-- 10. Grant necessary permissions
GRANT SELECT ON policy_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON policy_content TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE policy_content_id_seq TO authenticated;

SELECT '✅ Policy content table created successfully! Admins can now edit policies.' as status;