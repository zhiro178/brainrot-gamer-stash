import { StreamChat } from 'stream-chat';

// For development, we'll use a demo API key
// You'll replace this with your actual Stream Chat API key
const API_KEY = 'dz5f4d5kzrue'; // Demo API key for testing

// Create singleton Stream Chat client
let chatClient: StreamChat | null = null;

export const getStreamChatClient = () => {
  if (!chatClient) {
    chatClient = StreamChat.getInstance(API_KEY);
  }
  return chatClient;
};

// Generate a user token (in production, this should be done on your backend)
export const generateUserToken = (userId: string) => {
  const client = getStreamChatClient();
  // For demo purposes, we'll use a development token
  // In production, generate this on your backend
  return client.devToken(userId);
};

// Connect user to Stream Chat
export const connectUser = async (user: { id: string; email: string; name?: string }, isAdmin: boolean = false) => {
  const client = getStreamChatClient();
  
  const streamUser = {
    id: user.id,
    name: user.name || user.email.split('@')[0],
    email: user.email,
    role: isAdmin ? 'admin' : 'user',
    image: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`,
  };

  const token = generateUserToken(user.id);
  
  try {
    await client.connectUser(streamUser, token);
    return client;
  } catch (error) {
    console.error('Failed to connect user to Stream Chat:', error);
    throw error;
  }
};

// Disconnect user
export const disconnectUser = async () => {
  const client = getStreamChatClient();
  try {
    await client.disconnectUser();
  } catch (error) {
    console.error('Failed to disconnect user from Stream Chat:', error);
  }
};

// Create or get a ticket channel
export const getTicketChannel = async (ticketId: string, members: string[]) => {
  const client = getStreamChatClient();
  
  const channel = client.channel('messaging', `ticket-${ticketId}`, {
    members: members,
    created_by_id: members[0],
  });

  try {
    await channel.watch();
    return channel;
  } catch (error) {
    console.error('Failed to create/get ticket channel:', error);
    throw error;
  }
};