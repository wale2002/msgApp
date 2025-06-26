export interface User {
  id: string;
  name?: string;
  email?: string;
  profilePicture?: string;
}

export interface Conversation {
  id: string;
  isGroupChat: boolean;
  groupName?: string;
  members: Array<{
    userId: string;
    name: string;
    unreadCount: number;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    photo?: string;
    timestamp: string;
  } | null;
  createdAt?: string;
}

export interface Message {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  photo?: string;
  timestamp: string;
  isRead: boolean;
}
