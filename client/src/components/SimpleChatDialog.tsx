import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SimpleTicketChat } from "./SimpleTicketChat";
import { MessageCircle } from "lucide-react";

interface SimpleChatDialogProps {
  ticket: {
    id: string;
    subject: string;
    status: string;
  };
  currentUser: any;
  isAdmin?: boolean;
  onOpen?: () => void;
}

export const SimpleChatDialog = ({ ticket, currentUser, isAdmin = false, onOpen }: SimpleChatDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && onOpen) {
      onOpen();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-400/50 w-full text-sm font-medium bg-gradient-to-r from-blue-500/5 to-blue-500/10 backdrop-blur-sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 border-blue-500/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Support Chat - {ticket.subject}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {currentUser && (
            <SimpleTicketChat 
              ticketId={ticket.id}
              ticketSubject={ticket.subject}
              currentUser={currentUser}
              isAdmin={isAdmin}
              ticketStatus={ticket.status}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};