"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ChatList from "../../comps/ChatList";
import ChatDetails from "../../comps/ChatDetails";
// import TopBar from "../../comps/TopBar";
// import BottomBar from "../../comps/BottomBar";

import Loader from "../../comps/Loader";
import { getMessages, Message, sendMessage } from "../../lib/api";
import { onMessageSent, subscribeToChat } from "../../lib/events";
import toast from "react-hot-toast";
import styles from "../../styles/Chat.module.css";
import { Component, ReactNode } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.error}>
          Something went wrong. Please refresh.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChatPage() {
  const router = useRouter();
  const { selectedChatId: queryChatId } = router.query;
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const isDev = process.env.NODE_ENV === "development";
  const messageIds = new Set<string>();

  useEffect(() => {
    if (
      queryChatId &&
      typeof queryChatId === "string" &&
      /^[a-f0-9]{24}$/.test(queryChatId)
    ) {
      if (isDev)
        console.log("Initializing selectedChatId from query:", queryChatId);
      setSelectedChatId(queryChatId);
      setIsMobileChatOpen(true);
    } else if (queryChatId) {
      if (isDev) console.log("Invalid queryChatId:", queryChatId);
      setError("Invalid chat ID from URL.");
      setLoading(false);
    }
  }, [queryChatId, isDev]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      messageIds.clear();
      return;
    }

    const validateChat = async () => {
      setLoading(true);
      try {
        const res = await getMessages(selectedChatId);
        if (isDev)
          console.log(
            "getMessages Response:",
            JSON.stringify(res.data, null, 2)
          );
        console.log(
          "getMessages Timestamps:",
          res.data.data?.messages.map((msg) => msg.timestamp)
        );
        const newMessages = res.data.data?.messages || [];
        setMessages(newMessages);
        messageIds.clear();
        newMessages.forEach((msg) => messageIds.add(msg.id));
        setError(null);
      } catch (err: any) {
        console.error("Error validating chat:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError(err.message || "Unable to load chat. Please try again.");
        toast.error(err.message || "Unable to load chat.");
        setSelectedChatId(null);
        setIsMobileChatOpen(false);
      } finally {
        setLoading(false);
      }
    };

    validateChat();

    const unsubscribePusher = subscribeToChat(selectedChatId);
    const unsubscribeEvent = onMessageSent(({ chatId, message }) => {
      if (isDev)
        console.log("ChatPage onMessageSent:", {
          chatId,
          messageId: message.id,
          tempId: message.tempId,
        });
      if (chatId === selectedChatId) {
        console.log("Received message timestamp:", message.timestamp);
        setMessages((prev) => {
          if (messageIds.has(message.id)) {
            if (isDev)
              console.log("Duplicate message ignored:", {
                id: message.id,
                tempId: message.tempId,
              });
            return prev;
          }

          const isOptimistic =
            message.id.startsWith("temp-") || message.id.startsWith("error-");
          const tempId = message.tempId;

          // Replace optimistic message
          if (tempId) {
            const existingIndex = prev.findIndex((msg) => msg.id === tempId);
            if (existingIndex !== -1) {
              if (isDev)
                console.log("Replacing optimistic message:", {
                  tempId,
                  newId: message.id,
                });
              messageIds.delete(tempId);
              messageIds.add(message.id);
              return [
                ...prev.slice(0, existingIndex),
                message,
                ...prev.slice(existingIndex + 1),
              ];
            }
          }

          // Add new message
          if (isDev)
            console.log("Adding message:", {
              id: message.id,
              tempId: message.tempId,
            });
          messageIds.add(message.id);
          return [...prev, message];
        });
      }
    });

    return () => {
      unsubscribePusher();
      unsubscribeEvent();
      messageIds.clear();
    };
  }, [selectedChatId, isDev]);

  const handleChatSelect = (chatId: string) => {
    if (chatId === selectedChatId) {
      if (isDev) console.log("Same chat selected, no action:", chatId);
      return;
    }
    if (isDev) console.log("Selected chat:", chatId);
    setSelectedChatId(chatId);
    setIsMobileChatOpen(true);
    router.push(`/chats?selectedChatId=${chatId}`, undefined, {
      shallow: true,
    });
  };

  const handleBackToChatList = () => {
    setSelectedChatId(null);
    setIsMobileChatOpen(false);
    router.push("/chats", undefined, { shallow: true });
  };

  const handleRetrySend = async (
    chatId: string,
    content: string,
    photo?: string
  ) => {
    try {
      const res = await sendMessage({ chatId, content, photo });
      if (isDev)
        console.log(
          "Retry sendMessage response:",
          JSON.stringify(res.data, null, 2)
        );
      if (res.data.status !== "success" || !res.data.data) {
        throw new Error(res.data.message || "Retry failed");
      }
      toast.success("Message sent successfully.");
    } catch (err: any) {
      console.error("Retry failed:", err);
      toast.error("Retry failed. Please try again.");
    }
  };

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className={styles.invalidChat}>
        <p>⚠️ {error}</p>
        <button onClick={handleBackToChatList}>Go to Chat List</button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.chatPage}>
        {!selectedChatId && (
          <div className={styles.topBar}>{/* <TopBar /> */}</div>
        )}
        <div className={styles.content}>
          <aside
            className={`${styles.chatListSidebar} ${
              isMobileChatOpen ? styles.hidden : ""
            }`}
          >
            <ChatList
              currentChatId={selectedChatId ?? undefined}
              onChatSelect={handleChatSelect}
            />
          </aside>
          <main
            className={`${styles.chatDetails} ${
              isMobileChatOpen ? styles.active : ""
            }`}
          >
            {selectedChatId ? (
              <>
                <button
                  onClick={handleBackToChatList}
                  className={styles.backButton}
                >
                  Back to Chats
                </button>
                <ChatDetails
                  chatId={selectedChatId}
                  messages={messages}
                  onRetrySend={handleRetrySend}
                />
              </>
            ) : (
              <div className={styles.noChatSelected}>
                <p>Select a chat to start messaging</p>
              </div>
            )}
          </main>
        </div>
        {!selectedChatId && (
          <div className={styles.bottomBar}>{/* <BottomBar /> */}</div>
        )}
      </div>
    </ErrorBoundary>
  );
}
