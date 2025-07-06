import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, User, Sparkles, Gamepad2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface LiveChatProps {
  user?: any;
}

const MASCOT_RESPONSES = {
  "hello": "Hey there, legendary gamer! 🎮✨ Welcome to 592 Stock - your ultimate gaming marketplace! I'm Stocky, your friendly AI assistant. Ready to level up your gaming experience? What can I help you with today?",
  "hi": "Hi there, champion! 👋🎮 I'm Stocky, the 592 Stock mascot! Whether you're hunting for rare items or need trading advice, I'm here to help you dominate the marketplace!",
  "help": "🌟 **I'm your gaming guru!** Here's what I can assist with:\n\n🎮 **Games & Items** - Browse our catalog\n💰 **Balance & Payments** - Top-up help\n🔒 **Account Support** - Login/security\n📈 **Trading Tips** - Pro strategies\n🎯 **Order Status** - Track purchases\n\nJust ask me anything!",
  "games": "🎮 **Our Epic Game Collection:**\n\n🐾 **Adopt Me** - Pets, eggs, exclusive items\n🌱 **Grow a Garden** - Seeds, tools, decorations\n🔪 **MM2** - Knives, guns, legendary items\n🧠 **Steal a Brainrot** - Unique collectibles\n\n✨ Which game world are you exploring today?",
  "payment": "💳 **Secure Payment Options:**\n\n⚡ **Crypto Payments** - Instant delivery, $5 minimum\n🎁 **Amazon Gift Cards** - Manual verification, 24h processing\n\n🔒 **100% Secure & Encrypted**\n✅ **Trusted by thousands of gamers**\n\nNeed help with a top-up?",
  "balance": "💰 **Your Gaming Wallet:**\n\nYour balance shows in the top-right when logged in! You can boost it with:\n• Crypto (instant delivery) ⚡\n• Amazon gift cards (24h processing) 🎁\n\nReady to power up your balance? 🚀",
  "support": "🎯 **Need More Help?**\n\n💬 **Live Chat** - You're here! (instant responses)\n🎫 **Support Tickets** - Complex issues\n📧 **Direct Contact** - Priority support\n⏰ **Response Time** - Usually under 5 minutes!\n\n🌟 We're here 24/7 for our gaming community!",
  "admin": "🛡️ **Admin detected!** Welcome back, boss! Need help managing the marketplace? I can assist with user questions while you handle the backend magic! 👑",
  "ticket": "🎫 **Support Tickets:**\n\nCreate tickets for:\n• Payment issues 💳\n• Item delivery problems 📦\n• Account security 🔒\n• Feature requests 💡\n\nGo to 'My Tickets' in the nav bar to manage them!",
  "default": "🤖✨ **Thanks for chatting with Stocky!**\n\nI'm getting smarter every day! Try asking me about:\n• 'games' - Browse our collection\n• 'payment' - Top-up methods\n• 'help' - Full command list\n• 'support' - Get assistance\n\nWhat gaming adventure can I help with? 🎮"
};

export const LiveChat = ({ user }: LiveChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "🎮✨ **Welcome to 592 Stock!**\n\nHey there, gamer! I'm **Stocky**, your AI gaming assistant! 🤖\n\nI'm here to help you navigate our epic marketplace, find rare items, and level up your trading game!\n\n💬 **Try asking me about:**\n• 'games' - Browse our collection\n• 'help' - See what I can do\n• 'payment' - Top-up methods\n\nWhat gaming adventure can I help with today? 🚀",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check if user is admin
    const isAdmin = user && (user.email === 'zhirocomputer@gmail.com' || user.email === 'ajay123phone@gmail.com');
    
    // Special admin greeting
    if (isAdmin && (message.includes('admin') || message.includes('hello') || message.includes('hi'))) {
      return MASCOT_RESPONSES.admin;
    }
    
    for (const [keyword, response] of Object.entries(MASCOT_RESPONSES)) {
      if (keyword !== "default" && keyword !== "admin" && message.includes(keyword)) {
        return response;
      }
    }
    
    return MASCOT_RESPONSES.default;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage),
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);

    setInputMessage("");
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full w-16 h-16 bg-gradient-primary hover:shadow-glow shadow-gaming transform transition-all duration-300 hover:scale-110"
          >
            {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </Button>
          {!isOpen && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gaming-success rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">AI</span>
            </div>
          )}
          {!isOpen && (
            <div className="absolute -top-12 right-0 bg-background border border-primary/20 rounded-lg px-3 py-1 shadow-lg">
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                💬 Need help? Chat with Stocky!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-96 z-40 bg-gradient-card border-primary/20 shadow-card animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="pb-3 bg-gradient-primary/10 border-b border-primary/20">
            <CardTitle className="flex items-center justify-between text-primary">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                  🤖
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold">Stocky</span>
                    <div className="w-2 h-2 bg-gaming-success rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs text-muted-foreground">592 Stock AI Assistant</p>
                </div>
              </div>
              <Badge className="bg-gaming-success/20 text-gaming-success border-gaming-success/30">
                ✨ AI Online
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex flex-col h-72">
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4 pr-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        message.sender === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-gaming-accent text-black"
                      }`}>
                        {message.sender === "user" ? <User className="h-3 w-3" /> : "🤖"}
                      </div>
                      <div className={`rounded-lg p-3 text-sm ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <p className="whitespace-pre-line">{message.text}</p>
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-background border-primary/20"
              />
              <Button type="submit" size="sm" className="bg-gradient-primary hover:shadow-glow">
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
};