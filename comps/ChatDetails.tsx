// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import Pusher from "pusher-js";
// import {
//   getMessages,
//   sendMessage,
//   markAsRead,
//   getMe,
//   User,
//   Message,
//   loadAuthToken,
// } from "../lib/api";
// import { emitMessageSent } from "../lib/events";
// import Loader from "./Loader";
// import MessageBox from "./MessageBox";
// import { AddPhotoAlternate, Send } from "@mui/icons-material";
// import { CldUploadButton, CldImage } from "next-cloudinary";
// import styles from "../styles/ChatDetails.module.css";
// import { debounce } from "lodash";

// let pusherInstance: Pusher | null = null;

// const getPusherInstance = () => {
//   if (!pusherInstance) {
//     pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_API_KEY!, {
//       cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
//       forceTLS: true,
//     });
//     pusherInstance.connection.bind("error", (err: any) => {
//       console.error("Pusher connection error:", err);
//     });
//   }
//   return pusherInstance;
// };

// const isDev = process.env.NODE_ENV === "development";

// interface ChatDetailsProps {
//   chatId: string;
//   messages: Message[];
//   onRetrySend: (chatId: string, content: string, photo?: string) => void;
// }

// const ChatDetails = ({ chatId, messages, onRetrySend }: ChatDetailsProps) => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [otherMembers, setOtherMembers] = useState<User[]>([]);
//   const [text, setText] = useState("");
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [isUserScrolling, setIsUserScrolling] = useState(false);
//   const bottomRef = useRef<HTMLDivElement>(null);
//   const messagesContainerRef = useRef<HTMLDivElement>(null);
//   const scrollPositionRef = useRef<number>(0);
//   const messageIds = useRef<Set<string>>(new Set(messages.map((m) => m.id)));

//   useEffect(() => {
//     setText("");
//     if (isDev) console.log("Reset text input for chatId:", chatId);
//   }, [chatId]);

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         loadAuthToken();
//         const token = localStorage.getItem("authToken");
//         if (!token) throw new Error("No auth token found, please log in");

//         const userRes = await getMe();
//         if (!userRes.data.success || !userRes.data.data) {
//           throw new Error(userRes.data.message || "Failed to fetch user data");
//         }
//         const user = userRes.data.data;
//         setCurrentUser(user);

//         const uniqueSenders = Array.from(
//           new Map(
//             messages.map((msg) => [
//               msg.sender,
//               { id: msg.sender, name: msg.senderName } as User,
//             ])
//           ).values()
//         ).filter((sender: User) => sender.id !== user.id);
//         setOtherMembers(uniqueSenders);
//         messageIds.current = new Set(messages.map((m) => m.id));
//         setHasMore(messages.length === 20);
//         await markAsRead(chatId);
//       } catch (err: any) {
//         console.error("Error fetching initial data:", err);
//         setError(err.message || "Failed to load chat details");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, [chatId, messages]);

//   const debouncedGetChatDetails = useCallback(
//     debounce(async (pageNum: number) => {
//       try {
//         setLoading(true);
//         const res = await getMessages(chatId, { page: pageNum, limit: 20 });
//         if (isDev)
//           console.log(
//             "ChatDetails getMessages:",
//             JSON.stringify(res.data, null, 2),
//             `Latency: ${Date.now() - (res.config.startTime || Date.now())}ms`
//           );
//         if (res.data.status !== "success" || !res.data.data?.messages) {
//           throw new Error(res.data.message || "Failed to fetch messages");
//         }
//         const newMessages = res.data.data.messages.filter(
//           (msg: Message) => !messageIds.current.has(msg.id)
//         );
//         newMessages.forEach((msg: Message) => messageIds.current.add(msg.id));
//         newMessages.forEach((msg) => emitMessageSent(chatId, msg));
//         setHasMore(res.data.data.messages.length === 20);
//         setPage(pageNum);
//       } catch (err: any) {
//         console.error("Error fetching more messages:", err);
//         setError(err.message || "Failed to load more messages");
//       } finally {
//         setLoading(false);
//       }
//     }, 500),
//     [chatId]
//   );

//   const handleScroll = useCallback(
//     debounce(() => {
//       const container = messagesContainerRef.current;
//       if (!container) {
//         if (isDev) console.warn("Scroll container ref is null");
//         return;
//       }
//       const { scrollTop, scrollHeight, clientHeight } = container;
//       if (isDev) console.log({ scrollTop, scrollHeight, clientHeight });

//       const isNearBottom =
//         Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
//       setIsUserScrolling(!isNearBottom);

//       if (scrollTop < 50 && hasMore && !loading) {
//         if (isDev) console.log(`Fetching page ${page + 1}`);
//         scrollPositionRef.current = scrollHeight;
//         debouncedGetChatDetails(page + 1);
//       }
//     }, 200),
//     [hasMore, loading, page]
//   );

//   useEffect(() => {
//     if (!isUserScrolling && bottomRef.current && messagesContainerRef.current) {
//       bottomRef.current.scrollIntoView({ behavior: "auto" });
//       if (isDev) console.log("Scrolled to bottom");
//     } else if (page > 1 && messagesContainerRef.current) {
//       const newHeight = messagesContainerRef.current.scrollHeight;
//       messagesContainerRef.current.scrollTop =
//         newHeight - scrollPositionRef.current;
//       if (isDev)
//         console.log(
//           "Restored scroll position:",
//           messagesContainerRef.current.scrollTop
//         );
//     }
//   }, [messages, isUserScrolling, page]);

//   useEffect(() => {
//     if (!chatId || chatId === "undefined" || typeof chatId !== "string") {
//       setError("Invalid chat ID");
//       setLoading(false);
//       return;
//     }

//     if (
//       !process.env.NEXT_PUBLIC_PUSHER_API_KEY ||
//       !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
//     ) {
//       setError("Pusher configuration error");
//       setLoading(false);
//       return;
//     }

//     const pusher = getPusherInstance();
//     const channel = pusher.subscribe(`chat-${chatId}`);
//     channel.bind("new-message", (newMessage: Message | null) => {
//       if (isDev)
//         console.log("Pusher new-message:", {
//           chatId,
//           messageId: newMessage?.id,
//           tempId: newMessage?.tempId,
//         });
//       if (
//         !newMessage ||
//         !newMessage.id ||
//         messageIds.current.has(newMessage.id)
//       ) {
//         console.warn("Invalid or duplicate message:", newMessage);
//         return;
//       }
//       messageIds.current.add(newMessage.id);
//       emitMessageSent(chatId, newMessage);
//       setIsUserScrolling(false);
//       markAsRead(chatId).catch((err) =>
//         console.error("Error marking as read:", err)
//       );
//     });

//     return () => {
//       channel.unbind_all();
//       pusher.unsubscribe(`chat-${chatId}`);
//       debouncedGetChatDetails.cancel();
//     };
//   }, [chatId]);

//   const sendText = async () => {
//     if (!text.trim()) return;
//     const messageContent = text.trim();
//     try {
//       const res = await sendMessage({ chatId, content: messageContent });
//       if (isDev)
//         console.log("sendMessage response:", JSON.stringify(res.data, null, 2));
//       if (res.data.status !== "success" || !res.data.data) {
//         throw new Error(res.data.message || "Failed to send message");
//       }
//       setText("");
//       if (isDev) console.log("Text input cleared:", { text: "" });
//     } catch (err: any) {
//       console.error("Error sending message:", {
//         message: err.message,
//         response: err.response?.data,
//         chatId,
//         content: messageContent,
//       });
//       setError("Failed to send message. Please retry.");
//     }
//   };

//   const sendPhoto = async (result: any) => {
//     try {
//       const secureUrl = result?.info?.secure_url;
//       if (!secureUrl) throw new Error("No secure URL from Cloudinary");
//       const res = await sendMessage({ chatId, content: secureUrl });
//       if (isDev)
//         console.log(
//           "sendMessage photo response:",
//           JSON.stringify(res.data, null, 2)
//         );
//       if (res.data.status !== "success" || !res.data.data) {
//         throw new Error(res.data.message || "Failed to send photo");
//       }
//     } catch (err: any) {
//       console.error("Error sending photo:", err);
//       setError("Failed to send photo. Please retry.");
//     }
//   };

//   const handleRetry = (message: Message) => {
//     if (message.id.startsWith("error-")) {
//       onRetrySend(chatId, message.content, message.photo);
//     }
//   };

//   if (error) {
//     return (
//       <div className={styles.error}>
//         <p>{error}</p>
//         <button onClick={() => debouncedGetChatDetails(1)}>Retry</button>
//       </div>
//     );
//   }

//   if (loading || !currentUser) return <Loader />;

//   return (
//     <div className={styles.chatDetails}>
//       <div
//         className={styles.chatHeader}
//         role="region"
//         aria-label="Chat participant"
//       >
//         {otherMembers.length > 0 && (
//           <>
//             {otherMembers[0]?.profilePicture ? (
//               <CldImage
//                 src={otherMembers[0].profilePicture}
//                 width={40}
//                 height={40}
//                 alt={`${otherMembers[0].name || "User"}'s profile picture`}
//                 className={styles.profilePhoto}
//                 crop="fill"
//                 gravity="face"
//                 onError={(e) => (e.currentTarget.src = "/assets/person.png")}
//               />
//             ) : (
//               <img
//                 src="/assets/person.png"
//                 alt="Default profile picture"
//                 className={styles.profilePhoto}
//               />
//             )}
//             <div className={styles.text}>
//               <p className={styles.textBaseBold}>
//                 {otherMembers[0]?.name || "Unknown User"}
//               </p>
//             </div>
//           </>
//         )}
//       </div>

//       <div
//         className={styles.chatBody}
//         onScroll={(e) => {
//           e.stopPropagation();
//           handleScroll();
//         }}
//         ref={messagesContainerRef}
//         style={{
//           maxHeight: "calc(100% - 120px)",
//         }} /* Adjust for header and sendMessage heights */
//       >
//         {loading && page > 1 && (
//           <div className={styles.loading}>Loading more messages...</div>
//         )}
//         {messages.length > 0 ? (
//           messages.map((message) => (
//             <div key={message.id}>
//               <MessageBox message={message} currentUser={currentUser} />
//               {message.id.startsWith("error-") && (
//                 <button
//                   onClick={() => handleRetry(message)}
//                   className={styles.retryButton}
//                 >
//                   Retry
//                 </button>
//               )}
//             </div>
//           ))
//         ) : (
//           <p className={styles.noMessages}>No messages yet</p>
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <div className={styles.sendMessage}>
//         <div className={styles.prepareMessage}>
//           <CldUploadButton
//             options={{ maxFiles: 1 }}
//             onSuccess={sendPhoto}
//             uploadPreset="upecg01j"
//             aria-label="Upload photo"
//           >
//             <AddPhotoAlternate
//               sx={{
//                 fontSize: "35px",
//                 color: "#737373",
//                 cursor: "pointer",
//                 "&:hover": { color: "#ff4d4f" },
//               }}
//             />
//           </CldUploadButton>
//           <input
//             type="text"
//             placeholder="Write a message..."
//             className={styles.inputField}
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//             onKeyPress={(e) => e.key === "Enter" && sendText()}
//             aria-label="Message input"
//           />
//         </div>
//         <button onClick={sendText} aria-label="Send message">
//           <Send className={styles.sendIcon} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ChatDetails;

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import {
  getMessages,
  sendMessage,
  markAsRead,
  getMe,
  User,
  Message,
  loadAuthToken,
} from "../lib/api";
import { emitMessageSent } from "../lib/events";
import Loader from "./Loader";
import MessageBox from "./MessageBox";
import { AddPhotoAlternate, Send } from "@mui/icons-material";
import { CldUploadButton, CldImage } from "next-cloudinary";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherMembers, setOtherMembers] = useState<User[]>([]);
  const [text, setText] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const messageIds = useRef<Set<string>>(new Set(messages.map((m) => m.id)));

  useEffect(() => {
    setText("");
    if (isDev) console.log("Reset text input for chatId:", chatId);
  }, [chatId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        loadAuthToken();
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No auth token found, please log in");

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
                  profilePicture: msg.senderPhoto || "", // Add senderPhoto in Message type if needed
                } as User,
              ])
          ).values()
        );
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

        console.log("👥 uniqueSenders:", uniqueSenders);

        setOtherMembers(uniqueSenders);

        messageIds.current = new Set(messages.map((m) => m.id));
        setHasMore(messages.length === 20);
        await markAsRead(chatId);
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError(err.message || "Failed to load chat details");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [chatId, messages]);

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
    channel.bind("new-message", (newMessage: Message | null) => {
      if (isDev)
        console.log("Pusher new-message:", {
          chatId,
          messageId: newMessage?.id,
          tempId: newMessage?.tempId,
        });
      if (
        !newMessage ||
        !newMessage.id ||
        messageIds.current.has(newMessage.id)
      ) {
        console.warn("Invalid or duplicate message:", newMessage);
        return;
      }
      messageIds.current.add(newMessage.id);
      emitMessageSent(chatId, newMessage);
      setIsUserScrolling(false);
      markAsRead(chatId).catch((err) =>
        console.error("Error marking as read:", err)
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

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => debouncedGetChatDetails(1)}>Retry</button>
      </div>
    );
  }

  //   if (loading || !currentUser) return <Loader />;

  //   return (
  //     <div className={styles.chatDetails}>
  //       <div
  //         className={styles.chatHeader}
  //         role="region"
  //         aria-label="Chat participant"
  //       >
  //         {otherMembers.length > 0 && (
  //           <>
  //             {otherMembers[0]?.profilePicture ? (
  //               <CldImage
  //                 src={otherMembers[0].profilePicture}
  //                 width={40}
  //                 height={40}
  //                 alt={`${otherMembers[0].name || "User"}'s profile picture`}
  //                 className={styles.profilePhoto}
  //                 crop="fill"
  //                 gravity="face"
  //                 onError={(e) => (e.currentTarget.src = "/assets/person.png")}
  //               />
  //             ) : (
  //               <img
  //                 src="/assets/person.png"
  //                 alt="Default profile picture"
  //                 className={styles.profilePhoto}
  //               />
  //             )}
  //             <div className={styles.text}>
  //               <p className={styles.textBaseBold}>
  //                 {otherMembers[0]?.name || "Unknown User"}
  //               </p>
  //             </div>
  //           </>
  //         )}
  //       </div>

  //       <div
  //         className={styles.chatBody}
  //         onScroll={(e) => {
  //           e.stopPropagation();
  //           handleScroll();
  //         }}
  //         ref={messagesContainerRef}
  //         style={{
  //           maxHeight: "calc(100% - 120px)",
  //         }} /* Adjust for header and sendMessage heights */
  //       >
  //         {loading && page > 1 && (
  //           <div className={styles.loading}>Loading more messages...</div>
  //         )}
  //         {messages.length > 0 ? (
  //           messages.map((message) => (
  //             <div key={message.id}>
  //               <MessageBox message={message} currentUser={currentUser} />
  //               {message.id.startsWith("error-") && (
  //                 <button
  //                   onClick={() => handleRetry(message)}
  //                   className={styles.retryButton}
  //                 >
  //                   Retry
  //                 </button>
  //               )}
  //             </div>
  //           ))
  //         ) : (
  //           <p className={styles.noMessages}>No messages yet</p>
  //         )}
  //         <div ref={bottomRef} />
  //       </div>

  //       <div className={styles.sendMessage}>
  //         <div className={styles.prepareMessage}>
  //           <CldUploadButton
  //             options={{ maxFiles: 1 }}
  //             onSuccess={sendPhoto}
  //             uploadPreset="upecg01j"
  //             aria-label="Upload photo"
  //           >
  //             <AddPhotoAlternate
  //               sx={{
  //                 fontSize: "35px",
  //                 color: "#737373",
  //                 cursor: "pointer",
  //                 "&:hover": { color: "#ff4d4f" },
  //               }}
  //             />
  //           </CldUploadButton>
  //           <input
  //             type="text"
  //             placeholder="Write a message..."
  //             className={styles.inputField}
  //             value={text}
  //             onChange={(e) => setText(e.target.value)}
  //             onKeyPress={(e) => e.key === "Enter" && sendText()}
  //             aria-label="Message input"
  //           />
  //         </div>
  //         <button onClick={sendText} aria-label="Send message">
  //           <Send className={styles.sendIcon} />
  //         </button>
  //       </div>
  //     </div>
  //   );
  // };
  return (
    <div className={styles.chatDetails}>
      {/* Header */}
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
                  // You can log errors here but CldImage doesn't support native onError fallback
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

      {/* Chat Body */}
      <div
        className={styles.chatBody}
        onScroll={(e) => {
          e.stopPropagation();
          handleScroll();
        }}
        ref={messagesContainerRef}
        style={{
          maxHeight: "calc(100% - 120px)",
          minHeight: "300px", // Prevents layout collapse
          backgroundColor: "#f9f9f9", // Avoids white flash
        }}
      >
        {loading && page === 1 && (
          <div className={styles.loading}>Loading chat...</div>
        )}

        {!loading && messages.length > 0 ? (
          messages.map((message) => (
            <div key={message.id}>
              <MessageBox message={message} currentUser={currentUser} />
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

      {/* Footer Input */}
      <div className={styles.sendMessage}>
        <div className={styles.prepareMessage}>
          <CldUploadButton
            options={{ maxFiles: 1 }}
            onSuccess={sendPhoto}
            uploadPreset="upecg01j"
            aria-label="Upload photo"
          >
            <AddPhotoAlternate
              sx={{
                fontSize: "35px",
                color: "#737373",
                cursor: "pointer",
                "&:hover": { color: "#ff4d4f" },
              }}
            />
          </CldUploadButton>
          <input
            type="text"
            placeholder="Write a message..."
            className={styles.inputField}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendText()}
            aria-label="Message input"
          />
        </div>
        <button onClick={sendText} aria-label="Send message">
          <Send className={styles.sendIcon} />
        </button>
      </div>
    </div>
  );
};

export default ChatDetails;
