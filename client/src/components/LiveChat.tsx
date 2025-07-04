import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, User } from "lucide-react";

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
  "hello": "Hey there, gamer! 🎮 Welcome to 592 Stock! I'm here to help you with anything you need. What can I assist you with today?",
  "hi": "Hi! 👋 I'm the 592 Stock mascot! How can I help you find the perfect gaming items today?",
  "help": "I'm here to help! 🌟 You can ask me about:\n• Available games and items\n• How to top up your balance\n• Payment methods\n• Account questions\n• Trading tips",
  "games": "We currently offer items for these amazing games:\n🎮 Adopt Me\n🌱 Grow a Garden\n🔪 MM2 (Murder Mystery 2)\n🧠 Steal a Brainrot\n\nWhich game interests you most?",
  "payment": "We accept two payment methods:\n💳 Crypto payments (instant, minimum $5)\n🎁 Amazon gift cards (manual verification, 24h processing)\n\nBoth are secure and reliable!",
  "balance": "Your balance appears in the top right corner when logged in! 💰 You can top up using crypto or Amazon gift cards. Need help with a top-up?",
  "support": "For additional support:\n📧 Contact our team\n💬 Use this chat for quick questions\n⏰ We typically respond within minutes!",
  "default": "Thanks for your message! 🤖 I'm still learning, but I can help with questions about games, payments, accounts, and more. Try asking about 'games', 'payment', or 'help'!"
};

export const LiveChat = ({ user }: LiveChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey there! 🎮 I'm the 592 Stock mascot! I'm here to help you with any questions about our gaming marketplace. How can I assist you today?",
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
    
    for (const [keyword, response] of Object.entries(MASCOT_RESPONSES)) {
      if (keyword !== "default" && message.includes(keyword)) {
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
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 bg-gradient-primary hover:shadow-glow shadow-gaming"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-96 z-40 bg-gradient-card border-primary/20 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-primary">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                🤖
              </div>
              <span>592 Stock Support</span>
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