"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import {
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  getMe,
  User,
  Message,
  loadAuthToken,
} from "../lib/api";
import { emitMessageSent } from "../lib/events";
import Loader from "./Loader";
import MessageBox from "./MessageBox";
import { useRouter } from "next/router";
import { AddPhotoAlternate, Send, InsertEmoticon } from "@mui/icons-material";
import { CldUploadButton, CldImage } from "next-cloudinary";
import EmojiPicker from "emoji-picker-react";
import styles from "../styles/ChatDetails.module.css";
import { debounce } from "lodash";

let pusherInstance: Pusher | null = null;

const getPusherInstance = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_API_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    });
    pusherInstance.connection.bind("error", (err: any) => {
      console.error("Pusher connection error:", err);
    });
  }
  return pusherInstance;
};

const isDev = process.env.NODE_ENV === "development";

interface ChatDetailsProps {
  chatId: string;
  messages: Message[];
  onRetrySend: (chatId: string, content: string, photo?: string) => void;
}

const ChatDetails = ({ chatId, messages, onRetrySend }: ChatDetailsProps) => {
  const router = useRouter();
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherMembers, setOtherMembers] = useState<User[]>([]);
  const [text, setText] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // 🆕 State for emoji picker
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const messageIds = useRef<Set<string>>(new Set(messages.map((m) => m.id)));

  useEffect(() => {
    setText("");
    if (isDev) console.log("Reset text input for chatId:", chatId);
  }, [chatId]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        loadAuthToken();
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No auth token found, please log in");

        if (!chatId || typeof chatId !== "string" || chatId === "undefined") {
          router.replace("/chat", undefined, { shallow: true });
          return;
        }

        const userRes = await getMe();
        if (!userRes.data.success || !userRes.data.data) {
          throw new Error(userRes.data.message || "Failed to fetch user data");
        }

        const user = userRes.data.data;
        setCurrentUser(user);

        const uniqueSenders = Array.from(
          new Map(
            messages
              .filter((msg) => msg.sender !== user.id)
              .map((msg) => [
                msg.sender,
                {
                  id: msg.sender,
                  name: msg.senderName || "Unknown User",
                  profilePicture: msg.senderPhoto || "",
                } as User,
              ])
          )
        ).map(([_, user]) => user);

        setOtherMembers(uniqueSenders);

        if (uniqueSenders.length === 0 && messages.length > 0) {
          const firstMessage = messages[0];
          if (firstMessage.sender !== user.id) {
            uniqueSenders.push({
              id: firstMessage.sender,
              name: firstMessage.senderName || "Unknown User",
              profilePicture: firstMessage.senderPhoto || "",
            });
          }
        }

        setOtherMembers(uniqueSenders);
        messageIds.current = new Set(messages.map((m) => m.id));
        setHasMore(messages.length === 20);

        try {
          await markAsRead(chatId);
        } catch (err: any) {
          console.warn("Chat may have been deleted:", err.message);
        }
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "Failed to load chat details");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [chatId, messages]);

  useEffect(() => {
    if (!chatId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getMessages(chatId, { page: 1, limit: 20 });
        const latestMessages: Message[] = res.data?.data?.messages || [];

        setLocalMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = latestMessages.filter((m) => !existingIds.has(m.id));

          if (newOnes.length > 0) {
            return [...prev, ...newOnes].sort(
              (a, b) =>
                new Date(a.createdAt ?? 0).getTime() -
                new Date(b.createdAt ?? 0).getTime()
            );
          }
          return prev;
        });
      } catch (err) {
        if (isDev) console.warn("Polling failed:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [chatId]);

  const debouncedGetChatDetails = useCallback(
    debounce(async (pageNum: number) => {
      try {
        setLoading(true);
        const res = await getMessages(chatId, { page: pageNum, limit: 20 });
        if (isDev)
          console.log(
            "ChatDetails getMessages:",
            JSON.stringify(res.data, null, 2),
            `Latency: ${Date.now() - (res.config.startTime || Date.now())}ms`
          );
        if (res.data.status !== "success" || !res.data.data?.messages) {
          throw new Error(res.data.message || "Failed to fetch messages");
        }
        const newMessages = res.data.data.messages.filter(
          (msg: Message) => !messageIds.current.has(msg.id)
        );
        newMessages.forEach((msg: Message) => messageIds.current.add(msg.id));
        newMessages.forEach((msg) => emitMessageSent(chatId, msg));
        setHasMore(res.data.data.messages.length === 20);
        setPage(pageNum);
      } catch (err: any) {
        console.error("Error fetching more messages:", err);
        setError(err.message || "Failed to load more messages");
      } finally {
        setLoading(false);
      }
    }, 500),
    [chatId]
  );

  const handleDeleteMessage = async (messageId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );
    if (!confirmDelete) return;

    try {
      setLocalMessages((prevMessages) => {
        messageIds.current.delete(messageId);
        return prevMessages.filter((msg) => msg.id !== messageId);
      });

      const res = await deleteMessage(messageId);

      if (res.data.success) {
        console.log(`✅ Message deleted: ${messageId}`);
      } else {
        console.error(`⚠️ Backend failed: ${res.data.message}`);
        throw new Error(res.data.message || "Failed to delete message");
      }
    } catch (err: any) {
      console.error("❌ Delete failed:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleScroll = useCallback(
    debounce(() => {
      const container = messagesContainerRef.current;
      if (!container) {
        if (isDev) console.warn("Scroll container ref is null");
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (isDev) console.log({ scrollTop, scrollHeight, clientHeight });

      const isNearBottom =
        Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
      setIsUserScrolling(!isNearBottom);

      if (scrollTop < 50 && hasMore && !loading) {
        if (isDev) console.log(`Fetching page ${page + 1}`);
        scrollPositionRef.current = scrollHeight;
        debouncedGetChatDetails(page + 1);
      }
    }, 200),
    [hasMore, loading, page]
  );

  useEffect(() => {
    if (!isUserScrolling && bottomRef.current && messagesContainerRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
      if (isDev) console.log("Scrolled to bottom");
    } else if (page > 1 && messagesContainerRef.current) {
      const newHeight = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.scrollTop =
        newHeight - scrollPositionRef.current;
      if (isDev)
        console.log(
          "Restored scroll position:",
          messagesContainerRef.current.scrollTop
        );
    }
  }, [messages, isUserScrolling, page]);

  useEffect(() => {
    if (!chatId || chatId === "undefined" || typeof chatId !== "string") {
      setError("Invalid chat ID");
      setLoading(false);
      return;
    }

    if (
      !process.env.NEXT_PUBLIC_PUSHER_API_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      setError("Pusher configuration error");
      setLoading(false);
      return;
    }

    const pusher = getPusherInstance();
    const channel = pusher.subscribe(`chat-${chatId}`);

    channel.bind("message-deleted", (data: { messageId: string }) => {
      messageIds.current.delete(data.messageId);
      console.log("🔄 message-deleted received", data.messageId);

      setLocalMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== data.messageId)
      );
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`chat-${chatId}`);
      debouncedGetChatDetails.cancel();
    };
  }, [chatId]);

  const sendText = async () => {
    if (!text.trim()) return;
    const messageContent = text.trim();
    try {
      const res = await sendMessage({ chatId, content: messageContent });
      if (isDev)
        console.log("sendMessage response:", JSON.stringify(res.data, null, 2));
      if (res.data.status !== "success" || !res.data.data) {
        throw new Error(res.data.message || "Failed to send message");
      }
      setText("");
      if (isDev) console.log("Text input cleared:", { text: "" });
    } catch (err: any) {
      console.error("Error sending message:", {
        message: err.message,
        response: err.response?.data,
        chatId,
        content: messageContent,
      });
      setError("Failed to send message. Please retry.");
    }
  };

  const sendPhoto = async (result: any) => {
    console.log("Cloudinary response:", result);
    try {
      const secureUrl = result?.info?.secure_url;
      if (!secureUrl) throw new Error("No secure URL from Cloudinary");
      const res = await sendMessage({ chatId, content: secureUrl });
      if (isDev)
        console.log(
          "sendMessage photo response:",
          JSON.stringify(res.data, null, 2)
        );
      if (res.data.status !== "success" || !res.data.data) {
        throw new Error(res.data.message || "Failed to send photo");
      }
    } catch (err: any) {
      console.error("Error sending photo:", err);
      setError("Failed to send photo. Please retry.");
    }
  };

  const handleRetry = (message: Message) => {
    if (message.id.startsWith("error-")) {
      onRetrySend(chatId, message.content, message.photo);
    }
  };

  // 🆕 Emoji picker handler
  const handleEmojiClick = (emoji: any) => {
    setText((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={styles.chatDetails}>
      <div
        className={styles.chatHeader}
        role="region"
        aria-label="Chat participant"
      >
        {otherMembers.length > 0 && (
          <>
            {otherMembers[0]?.profilePicture &&
            otherMembers[0].profilePicture.trim() !== "" ? (
              <CldImage
                src={otherMembers[0].profilePicture}
                width={40}
                height={40}
                alt={`${otherMembers[0].name || "User"}'s profile`}
                className={styles.profilePhoto}
                crop="fill"
                gravity="face"
                onError={() => {
                  console.warn("Cloudinary image failed to load");
                }}
              />
            ) : (
              <img
                src="/assets/person.png"
                alt="Default profile picture"
                className={styles.profilePhoto}
              />
            )}
            <div className={styles.text}>
              <p className={styles.textBaseBold}>
                {otherMembers[0]?.name || "Unknown User"}
              </p>
            </div>
          </>
        )}
      </div>

      <div
        className={styles.chatBody}
        onScroll={(e) => {
          e.stopPropagation();
          handleScroll();
        }}
        ref={messagesContainerRef}
        style={{
          maxHeight: "calc(100% - 120px)",
          minHeight: "300px",
          backgroundColor: "transparent",
        }}
      >
        {loading && page === 1 && (
          <div className={styles.loading}>Loading chat...</div>
        )}

        {!loading && localMessages.length > 0 ? (
          localMessages
            .filter((message) => !message.isDeleted)
            .map((message) => (
              <div key={message.id}>
                <MessageBox
                  message={message}
                  currentUser={currentUser}
                  onDelete={handleDeleteMessage}
                />
                {message.id.startsWith("error-") && (
                  <button
                    onClick={() => handleRetry(message)}
                    className={styles.retryButton}
                  >
                    Retry
                  </button>
                )}
              </div>
            ))
        ) : !loading && page === 1 ? (
          <p className={styles.noMessages}>No messages yet</p>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className={styles.sendMessage}>
        <div className={styles.prepareMessage}>
          <div className={styles.inputSearchContainer}>
            <CldUploadButton
              uploadPreset="ml_default"
              onSuccess={sendPhoto}
              className={styles.attachmentButton}
            >
              <AddPhotoAlternate />
            </CldUploadButton>
            {/* 🆕 Emoji picker button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={styles.emojiButton}
              aria-label="Open emoji picker"
            >
              <InsertEmoticon />
            </button>
            {/* 🆕 Emoji picker component */}
            {showEmojiPicker && (
              <div className={styles.emojiPicker}>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
            <input
              type="text"
              placeholder="Write a message..."
              className={styles.inputSearch}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              aria-label="Message input"
            />
            <span className={styles.inputSearchIcon}></span>
            <button
              onClick={sendText}
              className={styles.sendButton}
              aria-label="Send message"
            >
              <Send className={styles.sendIcon} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDetails;
