"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import {
  getChats,
  getMe,
  User,
  Conversation,
  Message,
  loadAuthToken,
} from "../lib/api";
import { onMessageSent, onNewChat } from "../lib/events";
import ChatBox from "./ChatBox";
import { useRouter } from "next/router";
import Link from "next/link";
import Loader from "./Loader";
import { Logout, Contacts } from "@mui/icons-material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import styles from "../styles/ChatList.module.css";

let pusherInstance: Pusher | null = null;

const getPusherInstance = () => {
  if (!pusherInstance) {
    const apiKey = process.env.NEXT_PUBLIC_PUSHER_API_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!apiKey || !cluster) {
      console.error("Pusher configuration missing");
      return null;
    }
    try {
      pusherInstance = new Pusher(apiKey, {
        cluster,
        forceTLS: true,
      });
      pusherInstance.connection.bind("error", (err: any) => {
        console.error("Pusher connection error:", err);
      });
      console.log("Pusher initialized successfully");
    } catch (err) {
      console.error("Failed to initialize Pusher:", err);
      return null;
    }
  }
  return pusherInstance;
};

const isDev = process.env.NODE_ENV === "development";

interface ChatListProps {
  currentChatId?: string;
  onChatSelect?: (chatId: string) => void;
}

const ChatList = ({ currentChatId, onChatSelect }: ChatListProps) => {
  const [loading, setLoading] = useState(true);
  const [pollingLoading, setPollingLoading] = useState(false);
  const [chats, setChats] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogout = () => {
    // Call your logout logic or redirect
    localStorage.removeItem("authToken");
    router.push("/auth");
  };

  const handleContacts = () => {
    router.push("/contacts");
  };

  const getChatList = async (isPolling = false) => {
    try {
      if (isPolling) setPollingLoading(true);
      loadAuthToken();
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found");

      if (isDev)
        console.log("ChatList token:", token?.substring(0, 10) + "...");

      if (!currentUser) {
        const userRes = await getMe();
        if (!userRes.data.success || !userRes.data.data) {
          throw new Error("Failed to fetch user");
        }
        setCurrentUser(userRes.data.data);
      }

      const res = await getChats();
      if (res.data.success) {
        const filteredChats = res.data.data
          .filter((chat: Conversation) => {
            if (!chat.id || chat.id === "undefined") {
              console.warn("Invalid chat ID detected:", chat);
              return false;
            }
            if (!search) return true;
            const chatName = chat.isGroupChat
              ? chat.groupName
              : chat.members
                  .filter((m) => m.userId !== currentUser?.id)
                  .map((m) => m.name)
                  .join(", ") || "Unnamed Chat";
            return chatName?.toLowerCase().includes(search.toLowerCase());
          })
          .sort((a, b) => {
            const timeA = a.lastMessage?.timestamp
              ? new Date(a.lastMessage.timestamp).getTime()
              : a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;
            const timeB = b.lastMessage?.timestamp
              ? new Date(b.lastMessage.timestamp).getTime()
              : b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;
            return timeB - timeA; // Newest first
          });
        setChats(filteredChats);
        if (isDev) console.log("Fetched chats:", filteredChats.length);
      } else {
        throw new Error(res.data.message || "Failed to fetch chats");
      }
    } catch (err: any) {
      console.error("Error fetching chats:", err);
      setError(err.message);
    } finally {
      if (isPolling) setPollingLoading(false);
      if (!isPolling) setLoading(false);
    }
  };

  const updateChatWithMessage = (chatId: string, message?: Message) => {
    setChats((prev) => {
      const chatIndex = prev.findIndex((chat) => chat.id === chatId);
      if (chatIndex === -1) {
        if (isDev) console.log(`Chat ${chatId} not found, refreshing chats`);
        getChatList(true);
        return prev;
      }
      let updatedChat = prev[chatIndex];
      if (message && message.timestamp) {
        updatedChat = {
          ...prev[chatIndex],
          lastMessage: {
            content: message.content,
            timestamp: message.timestamp,
            isRead: message.sender === currentUser?.id,
          },
        };
      } else {
        // Fallback for Pusher events without message
        updatedChat = {
          ...prev[chatIndex],
          lastMessage: {
            content: prev[chatIndex].lastMessage?.content || "New message",
            timestamp: new Date().toISOString(),
            isRead: false,
          },
        };
        if (isDev)
          console.log(
            `No message provided for ${chatId}, using default timestamp`
          );
      }
      const newChats = [...prev];
      newChats.splice(chatIndex, 1);
      newChats.unshift(updatedChat);
      if (isDev) console.log(`Updated chat ${chatId} with new message`);
      return newChats.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp
          ? new Date(a.lastMessage.timestamp).getTime()
          : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
        const timeB = b.lastMessage?.timestamp
          ? new Date(b.lastMessage.timestamp).getTime()
          : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
        return timeB - timeA;
      });
    });
  };

  useEffect(() => {
    getChatList();
    const interval = setInterval(() => getChatList(true), 10000); // 60s polling
    return () => clearInterval(interval);
  }, [search, currentUser]);

  useEffect(() => {
    loadAuthToken();
    const pusher = getPusherInstance();
    if (!pusher) {
      console.error("Pusher instance is null, skipping subscription");
      setError("Real-time updates unavailable");
      return;
    }

    const channel = pusher.subscribe("chats");
    channel.bind("new-chat", (data: Conversation) => {
      if (isDev) console.log("New chat event received:", data);
      if (!data?.id || data.id === "undefined") {
        console.warn("Invalid chat ID in Pusher new-chat event:", data);
        return;
      }
      setChats((prev) => {
        if (!prev.some((c) => c.id === data.id)) {
          const chatName = data.isGroupChat
            ? data.groupName
            : data.members
                .filter((m) => m.userId !== currentUser?.id)
                .map((m) => m.name)
                .join(", ") || "Unnamed Chat";
          if (
            !search ||
            chatName?.toLowerCase().includes(search.toLowerCase())
          ) {
            return [
              {
                ...data,
                lastMessage: data.lastMessage
                  ? {
                      ...data.lastMessage,
                      timestamp: data.lastMessage.timestamp
                        ? new Date(data.lastMessage.timestamp).toISOString()
                        : new Date().toISOString(),
                    }
                  : null,
                createdAt: data.createdAt
                  ? new Date(data.createdAt).toISOString()
                  : new Date().toISOString(),
              },
              ...prev,
            ].sort((a, b) => {
              const timeA = a.lastMessage?.timestamp
                ? new Date(a.lastMessage.timestamp).getTime()
                : a.createdAt
                ? new Date(a.createdAt).getTime()
                : 0;
              const timeB = b.lastMessage?.timestamp
                ? new Date(b.lastMessage.timestamp).getTime()
                : b.createdAt
                ? new Date(b.createdAt).getTime()
                : 0;
              return timeB - timeA;
            });
          }
        }
        return prev;
      });
    });

    channel.bind("message-sent", (data: { chatId: string }) => {
      if (isDev) console.log(`Message sent in chat ${data.chatId}`);
      if (!data?.chatId || data.chatId === "undefined") {
        console.warn("Invalid chatId in Pusher message-sent event:", data);
        return;
      }
      updateChatWithMessage(data.chatId);
    });

    const unsubscribeNewChat = onNewChat((chat: Conversation) => {
      if (isDev) console.log("Custom new-chat event received:", chat);
      if (!chat.id || chat.id === "undefined") {
        console.warn("Invalid chat ID in onNewChat event:", chat);
        return;
      }
      setChats((prev) => {
        if (!prev.some((c) => c.id === chat.id)) {
          const chatName = chat.isGroupChat
            ? chat.groupName
            : chat.members
                .filter((m) => m.userId !== currentUser?.id)
                .map((m) => m.name)
                .join(", ") || "Unnamed Chat";
          if (
            !search ||
            chatName?.toLowerCase().includes(search.toLowerCase())
          ) {
            return [
              {
                ...chat,
                lastMessage: chat.lastMessage
                  ? {
                      ...chat.lastMessage,
                      timestamp: chat.lastMessage.timestamp
                        ? new Date(chat.lastMessage.timestamp).toISOString()
                        : new Date().toISOString(),
                    }
                  : null,
                createdAt: chat.createdAt
                  ? new Date(chat.createdAt).toISOString()
                  : new Date().toISOString(),
              },
              ...prev,
            ].sort((a, b) => {
              const timeA = a.lastMessage?.timestamp
                ? new Date(a.lastMessage.timestamp).getTime()
                : a.createdAt
                ? new Date(a.createdAt).getTime()
                : 0;
              const timeB = b.lastMessage?.timestamp
                ? new Date(b.lastMessage.timestamp).getTime()
                : b.createdAt
                ? new Date(b.createdAt).getTime()
                : 0;
              return timeB - timeA;
            });
          }
        }
        return prev;
      });
    });

    const unsubscribeMessageSent = onMessageSent(({ chatId, message }) => {
      if (isDev) console.log("Custom message-sent event:", { chatId, message });
      updateChatWithMessage(chatId, message);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("chats");
      unsubscribeNewChat();
      unsubscribeMessageSent();
    };
  }, [currentUser, search]);

  if (loading) return <Loader />;

  return (
    <div className={styles.chatList} aria-label="Chat list">
      {error && <p className={styles.error}>{error}</p>}

      <input
        placeholder="Search chat..."
        className={styles.inputSearch}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search chats"
      />

      <div className={styles.chats}>
        {chats.length > 0 ? (
          chats.map((chat) => (
            <ChatBox
              key={chat.id}
              chat={chat}
              currentUser={currentUser}
              currentChatId={currentChatId}
              onChatSelect={onChatSelect}
            />
          ))
        ) : (
          <p className={styles.noChats}>No chats found</p>
        )}
      </div>
      <div className={styles.topBar}>
        <button
          onClick={handleContacts}
          aria-label="Go to Contacts"
          className={styles.iconButton}
        >
          <Contacts />
        </button>
        <Link href="/profile" passHref>
          <button className={styles.iconButton} aria-label="Profile">
            <AccountCircleIcon fontSize="large" />
          </button>
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className={styles.iconButton}
        >
          <Logout />
        </button>
      </div>
    </div>
  );
};

export default ChatList;
