import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PurchasePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={null}
        userBalance={0}
        balanceLoading={false}
        onLogin={() => {}}
        onRegister={() => {}}
        onLogout={() => {}}
        onUserUpdate={() => {}}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Purchase Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Important information about purchasing items on 592 Stock
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🛒 Purchase Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  All purchases on 592 Stock are processed securely through our payment system. 
                  We accept multiple payment methods including crypto and gift cards.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Add items to your cart and proceed to checkout</li>
                  <li>Select your preferred payment method</li>
                  <li>Complete payment verification</li>
                  <li>Receive your items instantly upon successful payment</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  💰 Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We accept the following payment methods:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Cryptocurrency (Bitcoin, Ethereum, and other supported coins)</li>
                  <li>Gift cards (Roblox, Steam, Amazon, and other popular cards)</li>
                  <li>Account balance (top-up your 592 Stock balance)</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  All payments are processed securely. We do not store payment information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  📦 Delivery Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We provide instant delivery for all digital gaming items:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Items are delivered immediately after successful payment</li>
                  <li>You will receive detailed instructions for claiming your items</li>
                  <li>Our support team is available 24/7 to assist with delivery</li>
                  <li>Delivery method varies by game (trade, code, or direct transfer)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🔄 Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We want you to be completely satisfied with your purchase:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Refunds are available within 24 hours if items cannot be delivered</li>
                  <li>Issues with item delivery will be resolved by our support team</li>
                  <li>Refunds are processed to your 592 Stock balance or original payment method</li>
                  <li>Contact support immediately if you experience any issues</li>
                </ul>
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  ⚠️ Digital items cannot be refunded once successfully delivered and claimed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🛡️ Security & Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Your security is our top priority:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>All transactions are encrypted and secure</li>
                  <li>We never ask for your game passwords or personal information</li>
                  <li>Items are sourced from verified and trusted suppliers</li>
                  <li>Your account information is protected and never shared</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  📞 Contact & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Need help with your purchase? Our support team is here to assist:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>24/7 live chat support available on all pages</li>
                  <li>Create a support ticket for detailed assistance</li>
                  <li>Response time: typically within 1-2 hours</li>
                  <li>All purchase issues are resolved quickly and fairly</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              By making a purchase, you agree to these terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePolicy;