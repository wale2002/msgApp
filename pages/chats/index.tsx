"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import ChatList from "../../comps/ChatList";
import Contacts from "../../comps/Contacts";
import Profile from "../../comps/Profile";
import ChatDetails from "../../comps/ChatDetails";
import Loader from "../../comps/Loader";
import { getMessages, Message, sendMessage } from "../../lib/api";
import {
  onMessageSent,
  subscribeToChat,
  onActiveChatRecipient,
} from "../../lib/events";
import toast from "react-hot-toast";
import styles from "../../styles/Chat.module.css";
import {
  FaComment,
  FaUser,
  FaPlus,
  FaBell,
  FaUserFriends,
  FaCalendar,
  FaSearch,
} from "react-icons/fa";
import { Logout } from "@mui/icons-material";
import { Component, ReactNode } from "react";

interface Task {
  id: string;
  title: string;
  dateTime: string;
  description?: string;
}

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
  const [activeSidebar, setActiveSidebar] = useState<"chats" | "contacts">(
    "chats"
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isDev = process.env.NODE_ENV === "development";
  const messageIds = new Set<string>();

  // Initialize tasks and isClient on client side after hydration
  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Sync tasks with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTasks = localStorage.getItem("tasks");
      setTasks(savedTasks ? JSON.parse(savedTasks) : []);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle queryChatId from URL
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
      setActiveSidebar("chats");
    } else if (queryChatId) {
      if (isDev) console.log("Invalid queryChatId:", queryChatId);
      setError("Invalid chat ID from URL.");
      setLoading(false);
    }
  }, [queryChatId, isDev]);

  // Fetch messages and subscribe to new messages
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
    setActiveSidebar("chats");
    router.push(`/chats/${chatId}`, undefined, { shallow: true });
  };

  const handleToggleSidebar = (sidebar: "chats" | "contacts" | "calendar") => {
    setActiveSidebar(sidebar === "contacts" ? "contacts" : "chats");
    setSelectedChatId(null);
    setIsMobileChatOpen(false);
    router.push(sidebar === "calendar" ? "/calendar" : "/chats", undefined, {
      shallow: true,
    });
  };

  const handleChatCreated = () => {
    setActiveSidebar("chats");
    setIsMobileChatOpen(true);
  };

  const handleBackToSidebar = () => {
    setSelectedChatId(null);
    setIsMobileChatOpen(false);
    router.push("/chats", undefined, { shallow: true });
  };

  const handleProfileClick = () => {
    router.push("/profile", undefined, { shallow: true });
  };

  const handleNewChat = () => {
    setActiveSidebar("contacts");
    setIsMobileChatOpen(false);
    router.push("/chats", undefined, { shallow: true });
  };

  const handleCalendarClick = () => {
    router.push("/calendar", undefined, { shallow: true });
  };

  const handleSearch = () => {
    console.log("Search clicked");
    // Implement search functionality if needed
  };

  const handleNotificationsClick = () => {
    setShowTasksModal(true);
  };

  const handleCloseModal = () => {
    setShowTasksModal(false);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    router.push("/auth");
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
        <button onClick={handleBackToSidebar}>
          Go to {activeSidebar === "chats" ? "Chats" : "Contacts"}
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.chatPage}>
        <div className={styles.content}>
          <aside className={styles.iconSidebar}>
            <button
              onClick={() => handleToggleSidebar("chats")}
              className={`${styles.iconButton} ${
                activeSidebar === "chats" ? styles.active : ""
              }`}
              aria-label="Switch to Chats"
            >
              <FaComment size={24} />
            </button>
            <button
              onClick={handleProfileClick}
              className={styles.iconButton}
              aria-label="View Profile"
            >
              <FaUser size={24} />
            </button>
            <button
              onClick={handleNewChat}
              className={styles.iconButton}
              aria-label="Start New Chat"
            >
              <FaPlus size={24} />
            </button>
            <button
              onClick={handleNotificationsClick}
              className={styles.iconButton}
              aria-label="View Notifications"
            >
              <FaBell size={24} />
              {isClient && tasks.length > 0 && (
                <span className={styles.notificationBadge}>{tasks.length}</span>
              )}
            </button>
            <button
              onClick={handleCalendarClick}
              className={`${styles.iconButton} ${
                router.pathname === "/calendar" ? styles.active : ""
              }`}
              aria-label="View Calendar"
            >
              <FaCalendar size={24} />
            </button>
            <button
              onClick={handleLogout}
              className={styles.iconButton}
              aria-label="Logout"
            >
              <Logout />
            </button>
            <button
              onClick={() => handleToggleSidebar("contacts")}
              className={`${styles.iconButton} ${
                activeSidebar === "contacts" ? styles.active : ""
              }`}
              aria-label="Switch to Contacts"
            >
              <FaUserFriends size={24} />
            </button>
          </aside>
          <aside
            className={`${styles.chatListSidebar} ${
              isMobileChatOpen || activeSidebar !== "chats" ? styles.hidden : ""
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
              <ChatDetails
                chatId={selectedChatId}
                messages={messages}
                onRetrySend={handleRetrySend}
              />
            ) : (
              <div className={styles.noChatSelected}>
                <p>
                  Select a {activeSidebar === "chats" ? "chat" : "contact"} to
                  start messaging
                </p>
              </div>
            )}
          </main>
          <aside
            className={`${styles.contactsSidebar} ${
              isMobileChatOpen || activeSidebar !== "contacts"
                ? styles.hidden
                : ""
            }`}
          >
            <Profile />
            <Contacts onChatCreated={handleChatCreated} />
          </aside>
          {isClient && showTasksModal && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h2>Pending Tasks</h2>
                {tasks.length === 0 ? (
                  <p>No tasks scheduled.</p>
                ) : (
                  <ul>
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <strong>{task.title}</strong> -{" "}
                        {format(new Date(task.dateTime), "MMMM d, yyyy h:mm a")}
                        {task.description && <p>{task.description}</p>}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={handleCloseModal}
                  className={styles.modalCloseButton}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/router";
// import { format } from "date-fns";
// import ChatList from "../../comps/ChatList";
// import Contacts from "../../comps/Contacts";
// import Profile from "../../comps/Profile";
// import ChatDetails from "../../comps/ChatDetails";
// import Loader from "../../comps/Loader";
// import { getMessages, Message, sendMessage, ExtendedUser } from "../../lib/api";
// import {
//   onMessageSent,
//   subscribeToChat,
//   onActiveChatRecipient,
// } from "../../lib/events";
// import toast from "react-hot-toast";
// import styles from "../../styles/Chat.module.css";
// import {
//   FaComment,
//   FaUser,
//   FaPlus,
//   FaBell,
//   FaUserFriends,
//   FaCalendar,
//   FaSearch,
// } from "react-icons/fa";
// import { Logout } from "@mui/icons-material";
// import { Component, ReactNode } from "react";

// interface Task {
//   id: string;
//   title: string;
//   dateTime: string;
//   description?: string;
// }

// class ErrorBoundary extends Component<
//   { children: ReactNode },
//   { hasError: boolean }
// > {
//   state = { hasError: false };
//   static getDerivedStateFromError() {
//     return { hasError: true };
//   }
//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className={styles.error}>
//           Something went wrong. Please refresh.
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// export default function ChatPage() {
//   const router = useRouter();
//   const { selectedChatId: queryChatId } = router.query;
//   const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
//   const [activeSidebar, setActiveSidebar] = useState<"chats" | "contacts">(
//     "chats"
//   );
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [showTasksModal, setShowTasksModal] = useState(false);
//   const [isClient, setIsClient] = useState(false);
//   const [activeChatRecipient, setActiveChatRecipient] =
//     useState<ExtendedUser | null>(null);
//   const isDev = process.env.NODE_ENV === "development";
//   const messageIds = new Set<string>();

//   // Initialize tasks and isClient on client side after hydration
//   useEffect(() => {
//     setIsClient(true);
//     const savedTasks = localStorage.getItem("tasks");
//     if (savedTasks) {
//       setTasks(JSON.parse(savedTasks));
//     }
//   }, []);

//   // Sync tasks with localStorage changes
//   useEffect(() => {
//     const handleStorageChange = () => {
//       const savedTasks = localStorage.getItem("tasks");
//       setTasks(savedTasks ? JSON.parse(savedTasks) : []);
//     };
//     window.addEventListener("storage", handleStorageChange);
//     return () => window.removeEventListener("storage", handleStorageChange);
//   }, []);

//   // Handle queryChatId from URL
//   useEffect(() => {
//     if (
//       queryChatId &&
//       typeof queryChatId === "string" &&
//       /^[a-f0-9]{24}$/.test(queryChatId)
//     ) {
//       if (isDev)
//         console.log("Initializing selectedChatId from query:", queryChatId);
//       setSelectedChatId(queryChatId);
//       setIsMobileChatOpen(true);
//       setActiveSidebar("chats");
//     } else if (queryChatId) {
//       if (isDev) console.log("Invalid queryChatId:", queryChatId);
//       setError("Invalid chat ID from URL.");
//       setLoading(false);
//     }
//   }, [queryChatId, isDev]);

//   // Subscribe to active chat recipient events
//   useEffect(() => {
//     const unsubscribeActiveRecipient = onActiveChatRecipient((recipient) => {
//       if (isDev) console.log("Received active chat recipient:", recipient);
//       setActiveChatRecipient(recipient);
//     });

//     return () => {
//       unsubscribeActiveRecipient();
//     };
//   }, [isDev]);

//   // Fetch messages and subscribe to new messages
//   useEffect(() => {
//     if (!selectedChatId) {
//       setMessages([]);
//       messageIds.clear();
//       setActiveChatRecipient(null); // Clear recipient when no chat is selected
//       return;
//     }

//     const validateChat = async () => {
//       setLoading(true);
//       try {
//         const res = await getMessages(selectedChatId);
//         if (isDev)
//           console.log(
//             "getMessages Response:",
//             JSON.stringify(res.data, null, 2)
//           );
//         console.log(
//           "getMessages Timestamps:",
//           res.data.data?.messages.map((msg) => msg.timestamp)
//         );
//         const newMessages = res.data.data?.messages || [];
//         setMessages(newMessages);
//         messageIds.clear();
//         newMessages.forEach((msg) => messageIds.add(msg.id));
//         setError(null);
//       } catch (err: any) {
//         console.error("Error validating chat:", {
//           message: err.message,
//           response: err.response?.data,
//           status: err.response?.status,
//         });
//         setError(err.message || "Unable to load chat. Please try again.");
//         toast.error(err.message || "Unable to load chat.");
//         setSelectedChatId(null);
//         setIsMobileChatOpen(false);
//         setActiveChatRecipient(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     validateChat();

//     const unsubscribePusher = subscribeToChat(selectedChatId);
//     const unsubscribeEvent = onMessageSent(({ chatId, message }) => {
//       if (isDev)
//         console.log("ChatPage onMessageSent:", {
//           chatId,
//           messageId: message.id,
//           tempId: message.tempId,
//         });
//       if (chatId === selectedChatId) {
//         console.log("Received message timestamp:", message.timestamp);
//         setMessages((prev) => {
//           if (messageIds.has(message.id)) {
//             if (isDev)
//               console.log("Duplicate message ignored:", {
//                 id: message.id,
//                 tempId: message.tempId,
//               });
//             return prev;
//           }

//           const isOptimistic =
//             message.id.startsWith("temp-") || message.id.startsWith("error-");
//           const tempId = message.tempId;

//           if (tempId) {
//             const existingIndex = prev.findIndex((msg) => msg.id === tempId);
//             if (existingIndex !== -1) {
//               if (isDev)
//                 console.log("Replacing optimistic message:", {
//                   tempId,
//                   newId: message.id,
//                 });
//               messageIds.delete(tempId);
//               messageIds.add(message.id);
//               return [
//                 ...prev.slice(0, existingIndex),
//                 message,
//                 ...prev.slice(existingIndex + 1),
//               ];
//             }
//           }

//           if (isDev)
//             console.log("Adding message:", {
//               id: message.id,
//               tempId: message.tempId,
//             });
//           messageIds.add(message.id);
//           return [...prev, message];
//         });
//       }
//     });

//     return () => {
//       unsubscribePusher();
//       unsubscribeEvent();
//       messageIds.clear();
//     };
//   }, [selectedChatId, isDev]);

//   const handleChatSelect = (chatId: string) => {
//     if (chatId === selectedChatId) {
//       if (isDev) console.log("Same chat selected, no action:", chatId);
//       return;
//     }
//     if (isDev) console.log("Selected chat:", chatId);
//     setSelectedChatId(chatId);
//     setIsMobileChatOpen(true);
//     setActiveSidebar("chats");
//     router.push(`/chats/${chatId}`, undefined, { shallow: true });
//   };

//   const handleToggleSidebar = (sidebar: "chats" | "contacts") => {
//     setActiveSidebar(sidebar);
//     setSelectedChatId(null);
//     setIsMobileChatOpen(false);
//     router.push("/chats", undefined, { shallow: true });
//   };

//   const handleChatCreated = () => {
//     setActiveSidebar("chats");
//     setIsMobileChatOpen(true);
//   };

//   const handleBackToSidebar = () => {
//     setSelectedChatId(null);
//     setIsMobileChatOpen(false);
//     setActiveChatRecipient(null);
//     router.push("/chats", undefined, { shallow: true });
//   };

//   const handleProfileClick = () => {
//     router.push("/profile", undefined, { shallow: true });
//   };

//   const handleNewChat = () => {
//     setActiveSidebar("contacts");
//     setIsMobileChatOpen(false);
//     router.push("/chats", undefined, { shallow: true });
//   };

//   const handleCalendarClick = () => {
//     router.push("/calendar", undefined, { shallow: true });
//   };

//   const handleSearch = () => {
//     console.log("Search clicked");
//     // Implement search functionality if needed
//   };

//   const handleNotificationsClick = () => {
//     setShowTasksModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowTasksModal(false);
//   };

//   const handleLogout = () => {
//     if (typeof window !== "undefined") {
//       localStorage.removeItem("authToken");
//     }
//     router.push("/auth");
//   };

//   const handleRetrySend = async (
//     chatId: string,
//     content: string,
//     photo?: string
//   ) => {
//     try {
//       const res = await sendMessage({ chatId, content, photo });
//       if (isDev)
//         console.log(
//           "Retry sendMessage response:",
//           JSON.stringify(res.data, null, 2)
//         );
//       if (res.data.status !== "success" || !res.data.data) {
//         throw new Error(res.data.message || "Retry failed");
//       }
//       toast.success("Message sent successfully.");
//     } catch (err: any) {
//       console.error("Retry failed:", err);
//       toast.error("Retry failed. Please try again.");
//     }
//   };

//   if (loading) return <Loader />;
//   if (error) {
//     return (
//       <div className={styles.invalidChat}>
//         <p>⚠️ {error}</p>
//         <button onClick={handleBackToSidebar}>
//           Go to {activeSidebar === "chats" ? "Chats" : "Contacts"}
//         </button>
//       </div>
//     );
//   }

//   return (
//     <ErrorBoundary>
//       <div className={styles.chatPage}>
//         <div className={styles.content}>
//           <aside className={styles.iconSidebar}>
//             <button
//               onClick={() => handleToggleSidebar("chats")}
//               className={`${styles.iconButton} ${
//                 activeSidebar === "chats" ? styles.active : ""
//               }`}
//               aria-label="Switch to Chats"
//             >
//               <FaComment size={24} />
//             </button>
//             <button
//               onClick={handleProfileClick}
//               className={styles.iconButton}
//               aria-label="View Profile"
//             >
//               <FaUser size={24} />
//             </button>
//             <button
//               onClick={handleNewChat}
//               className={styles.iconButton}
//               aria-label="Start New Chat"
//             >
//               <FaPlus size={24} />
//             </button>
//             <button
//               onClick={handleNotificationsClick}
//               className={styles.iconButton}
//               aria-label="View Notifications"
//             >
//               <FaBell size={24} />
//               {isClient && tasks.length > 0 && (
//                 <span className={styles.notificationBadge}>{tasks.length}</span>
//               )}
//             </button>
//             <button
//               onClick={handleCalendarClick}
//               className={`${styles.iconButton} ${
//                 router.pathname === "/calendar" ? styles.active : ""
//               }`}
//               aria-label="View Calendar"
//             >
//               <FaCalendar size={24} />
//             </button>
//             <button
//               onClick={handleLogout}
//               className={styles.iconButton}
//               aria-label="Logout"
//             >
//               <Logout />
//             </button>
//             <button
//               onClick={() => handleToggleSidebar("contacts")}
//               className={`${styles.iconButton} ${
//                 activeSidebar === "contacts" ? styles.active : ""
//               }`}
//               aria-label="Switch to Contacts"
//             >
//               <FaUserFriends size={24} />
//             </button>
//           </aside>
//           <aside
//             className={`${styles.chatListSidebar} ${
//               isMobileChatOpen || activeSidebar !== "chats" ? styles.hidden : ""
//             }`}
//           >
//             <ChatList
//               currentChatId={selectedChatId ?? undefined}
//               onChatSelect={handleChatSelect}
//             />
//           </aside>
//           <main
//             className={`${styles.chatDetails} ${
//               isMobileChatOpen ? styles.active : ""
//             }`}
//           >
//             {selectedChatId ? (
//               <ChatDetails
//                 chatId={selectedChatId}
//                 messages={messages}
//                 onRetrySend={handleRetrySend}
//               />
//             ) : (
//               <div className={styles.noChatSelected}>
//                 <p>
//                   Select a {activeSidebar === "chats" ? "chat" : "contact"} to
//                   start messaging
//                 </p>
//               </div>
//             )}
//           </main>
//           <aside
//             className={`${styles.contactsSidebar} ${
//               isMobileChatOpen || activeSidebar !== "contacts"
//                 ? styles.hidden
//                 : ""
//             }`}
//           >
//             <Profile />
//             <Contacts
//               onChatCreated={handleChatCreated}
//               activeChatRecipient={activeChatRecipient}
//             />
//           </aside>
//           {isClient && showTasksModal && (
//             <div className={styles.modal}>
//               <div className={styles.modalContent}>
//                 <h2>Pending Tasks</h2>
//                 {tasks.length === 0 ? (
//                   <p>No tasks scheduled.</p>
//                 ) : (
//                   <ul>
//                     {tasks.map((task) => (
//                       <li key={task.id}>
//                         <strong>{task.title}</strong> -{" "}
//                         {format(new Date(task.dateTime), "MMMM d, yyyy h:mm a")}
//                         {task.description && <p>{task.description}</p>}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//                 <button
//                   onClick={handleCloseModal}
//                   className={styles.modalCloseButton}
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </ErrorBoundary>
//   );
// }
