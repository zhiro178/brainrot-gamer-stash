-- Policy Editor Setup
-- Create table for storing editable policies

-- 1. Create the policies table
CREATE TABLE IF NOT EXISTS public.site_policies (
    id SERIAL PRIMARY KEY,
    policy_type VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.site_policies ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the policies table
CREATE POLICY "Public can read policies" ON public.site_policies
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage policies" ON public.site_policies
    FOR ALL USING (
        auth.jwt() ->> 'email' IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- 4. Insert default Purchase Policy content
INSERT INTO public.site_policies (policy_type, title, content, updated_by)
VALUES (
    'purchase_policy',
    'Purchase Policy',
    '{
        "sections": [
            {
                "id": "purchase_process",
                "icon": "🛒",
                "title": "Purchase Process",
                "content": {
                    "text": "All purchases on 592 Stock are processed securely through our payment system. We accept multiple payment methods including crypto and gift cards.",
                    "items": [
                        "Add items to your cart and proceed to checkout",
                        "Select your preferred payment method",
                        "Complete payment verification",
                        "Receive your items instantly upon successful payment"
                    ]
                }
            },
            {
                "id": "payment_methods",
                "icon": "💰",
                "title": "Payment Methods",
                "content": {
                    "text": "We accept the following payment methods:",
                    "items": [
                        "Cryptocurrency (Bitcoin, Ethereum, and other supported coins)",
                        "Gift cards (Roblox, Steam, Amazon, and other popular cards)",
                        "Account balance (top-up your 592 Stock balance)"
                    ],
                    "note": "All payments are processed securely. We do not store payment information."
                }
            },
            {
                "id": "delivery_policy",
                "icon": "📦",
                "title": "Delivery Policy",
                "content": {
                    "text": "We provide instant delivery for all digital gaming items:",
                    "items": [
                        "Items are delivered immediately after successful payment",
                        "You will receive detailed instructions for claiming your items",
                        "Our support team is available 24/7 to assist with delivery",
                        "Delivery method varies by game (trade, code, or direct transfer)"
                    ]
                }
            },
            {
                "id": "refund_policy",
                "icon": "🔄",
                "title": "Refund Policy",
                "content": {
                    "text": "We want you to be completely satisfied with your purchase:",
                    "items": [
                        "Refunds are available within 24 hours if items cannot be delivered",
                        "Issues with item delivery will be resolved by our support team",
                        "Refunds are processed to your 592 Stock balance or original payment method",
                        "Contact support immediately if you experience any issues"
                    ],
                    "warning": {
                        "type": "amber",
                        "text": "Important: Digital items cannot be refunded once successfully delivered and claimed."
                    }
                }
            },
            {
                "id": "security_safety",
                "icon": "🛡️",
                "title": "Security & Safety",
                "content": {
                    "text": "Your security is our top priority:",
                    "items": [
                        "All transactions are encrypted and secure",
                        "We never ask for your game passwords or personal information",
                        "Items are sourced from verified and trusted suppliers",
                        "Your account information is protected and never shared"
                    ]
                }
            },
            {
                "id": "contact_support",
                "icon": "📞",
                "title": "Contact & Support",
                "content": {
                    "text": "Need help with your purchase? Our support team is here to assist:",
                    "items": [
                        "24/7 live chat support available on all pages",
                        "Create a support ticket for detailed assistance",
                        "Response time: typically within 1-2 hours",
                        "All purchase issues are resolved quickly and fairly"
                    ]
                }
            }
        ],
        "footer": {
            "text": "By making a purchase, you agree to these terms and conditions."
        }
    }'::jsonb,
    'system'
) ON CONFLICT (policy_type) DO NOTHING;

-- 5. Insert default Terms of Service content
INSERT INTO public.site_policies (policy_type, title, content, updated_by)
VALUES (
    'terms_of_service',
    'Terms of Service',
    '{
        "sections": [
            {
                "id": "acceptance_terms",
                "icon": "📋",
                "title": "Acceptance of Terms",
                "content": {
                    "text": "By accessing and using 592 Stock, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
                    "info": {
                        "type": "blue",
                        "text": "These terms apply to all visitors, users, and others who access or use our service."
                    }
                }
            },
            {
                "id": "user_accounts",
                "icon": "👤",
                "title": "User Accounts",
                "content": {
                    "text": "To use our service, you must:",
                    "items": [
                        "Be at least 13 years old or have parental consent",
                        "Provide accurate and complete registration information",
                        "Maintain the security of your password and account",
                        "Verify your email address to activate full account features",
                        "Accept responsibility for all activities under your account"
                    ],
                    "tip": {
                        "type": "green",
                        "text": "Security Tip: We recommend using a strong, unique password for your account security."
                    }
                }
            },
            {
                "id": "service_description",
                "icon": "🛍️",
                "title": "Service Description",
                "content": {
                    "text": "592 Stock provides a digital marketplace for gaming items including:",
                    "items": [
                        "Virtual items from popular Roblox games",
                        "Secure payment processing and instant delivery",
                        "Customer support and account management",
                        "Balance management and transaction history"
                    ],
                    "note": "We reserve the right to modify or discontinue any part of our service with reasonable notice to users."
                }
            },
            {
                "id": "user_responsibilities",
                "icon": "⚖️",
                "title": "User Responsibilities",
                "content": {
                    "text": "As a user of 592 Stock, you agree to:",
                    "items": [
                        "Use the service only for lawful purposes",
                        "Not attempt to circumvent security measures",
                        "Not engage in fraudulent or deceptive practices",
                        "Respect the intellectual property rights of others",
                        "Not share your account credentials with others",
                        "Report any suspicious activity or security breaches"
                    ]
                }
            },
            {
                "id": "prohibited_activities",
                "icon": "🚫",
                "title": "Prohibited Activities",
                "content": {
                    "text": "The following activities are strictly prohibited:",
                    "items": [
                        "Attempting to hack, exploit, or damage our systems",
                        "Using automated tools to access our service (bots, scripts)",
                        "Creating multiple accounts to circumvent restrictions",
                        "Engaging in money laundering or illegal financial activities",
                        "Harassing other users or our support staff",
                        "Posting or sharing inappropriate content"
                    ],
                    "warning": {
                        "type": "red",
                        "text": "Warning: Violation of these terms may result in account suspension or termination."
                    }
                }
            },
            {
                "id": "payment_terms",
                "icon": "💳",
                "title": "Payment Terms",
                "content": {
                    "text": "Regarding payments and transactions:",
                    "items": [
                        "All prices are displayed in USD unless otherwise noted",
                        "Payment processing is handled securely by our partners",
                        "Chargebacks may result in account restrictions",
                        "Account balances are non-transferable between users",
                        "We reserve the right to verify payment sources"
                    ]
                }
            },
            {
                "id": "privacy_data",
                "icon": "🔒",
                "title": "Privacy & Data Protection",
                "content": {
                    "text": "Your privacy is important to us:",
                    "items": [
                        "We collect only necessary information to provide our service",
                        "Your personal data is protected and never sold to third parties",
                        "We use encryption to secure sensitive information",
                        "You can request deletion of your account and data",
                        "We comply with applicable data protection regulations"
                    ],
                    "security": {
                        "type": "purple",
                        "text": "Your data is encrypted both in transit and at rest using industry-standard protocols."
                    }
                }
            },
            {
                "id": "disclaimers_limitations",
                "icon": "⚠️",
                "title": "Disclaimers & Limitations",
                "content": {
                    "text": "Important legal information:",
                    "items": [
                        "Our service is provided \"as is\" without warranties",
                        "We are not liable for any losses from service interruptions",
                        "Digital items have no real-world monetary value",
                        "Game publishers may change their terms affecting our service",
                        "Our liability is limited to the amount paid for services"
                    ]
                }
            },
            {
                "id": "contact_support",
                "icon": "📞",
                "title": "Contact & Support",
                "content": {
                    "text": "If you have questions about these Terms of Service, please contact us:",
                    "items": [
                        "Use our 24/7 live chat support",
                        "Create a support ticket for detailed inquiries",
                        "All terms-related questions will be answered promptly"
                    ]
                }
            }
        ],
        "effective_date": {
            "title": "Terms Effective Date",
            "content": [
                "These terms are effective immediately and supersede all previous versions.",
                "By continuing to use our service, you acknowledge that you have read, understood, and agree to be bound by these terms."
            ]
        }
    }'::jsonb,
    'system'
) ON CONFLICT (policy_type) DO NOTHING;

-- 6. Verify the setup
SELECT 
    policy_type,
    title,
    last_updated,
    updated_by
FROM public.site_policies;

SELECT '✅ Policy Editor Setup Complete!' as status;