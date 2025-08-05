import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, MessageSquare, Ticket, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface SupportButtonProps {
  user?: any;
}

export const SupportButton = ({ user }: SupportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to create a support ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !category || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          category: category,
          description: description.trim(),
          status: 'open',
          priority: 'medium'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Support Ticket Created",
        description: "Your ticket has been created successfully. You can track it in 'My Tickets'.",
      });

      // Reset form
      setSubject("");
      setCategory("");
      setDescription("");
      setIsOpen(false);

      // Navigate to tickets page
      setLocation("/tickets");
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Support Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-full w-16 h-16 bg-gradient-primary hover:shadow-glow shadow-gaming transform transition-all duration-300 hover:scale-110"
            >
              <HelpCircle className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-primary" />
                <span>Create Support Ticket</span>
              </DialogTitle>
              <DialogDescription>
                Need help? Create a support ticket and our team will assist you.
              </DialogDescription>
            </DialogHeader>

            {!user ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="font-semibold">Login Required</h3>
                      <p className="text-sm text-muted-foreground">
                        Please log in to create a support ticket.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Support</SelectItem>
                      <SelectItem value="payment">Payment Issues</SelectItem>
                      <SelectItem value="delivery">Item Delivery</SelectItem>
                      <SelectItem value="account">Account Issues</SelectItem>
                      <SelectItem value="technical">Technical Problems</SelectItem>
                      <SelectItem value="refund">Refund Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide detailed information about your issue..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-primary hover:shadow-glow"
                  >
                    {isSubmitting ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Hover tooltip */}
        {!isOpen && (
          <div className="absolute -top-12 right-0 bg-background border border-primary/20 rounded-lg px-3 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              💬 Need help? Create a support ticket!
            </p>
          </div>
        )}
      </div>
    </>
  );
};