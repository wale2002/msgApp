// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/router";
// import ChatList from "../../comps/ChatList";
// import ChatDetails from "../../comps/ChatDetails";
// import TopBar from "../../comps/TopBar";
// import BottomBar from "../../comps/BottomBar";
// import Loader from "../../comps/Loader";
// import { getMessages } from "../../lib/api";
// import toast from "react-hot-toast";
// import styles from "../../styles/Chat.module.css";

// export default function ChatPage() {
//   const router = useRouter();
//   const { chatId } = router.query; // Gets chatId from URL (e.g., 6855c9c543d32655f0ad5df4)
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!chatId || typeof chatId !== "string" || chatId.trim() === "") {
//       setError("Invalid chat ID. Please select a valid chat.");
//       setLoading(false);
//       return;
//     }

//     const validateChat = async () => {
//       try {
//         const res = await getMessages(chatId);
//         console.log("getMessages Response:", JSON.stringify(res.data, null, 2));
//         setError(null);
//       } catch (err: any) {
//         console.error("Error validating chat:", {
//           message: err.message,
//           response: err.response?.data,
//           status: err.response?.status,
//         });
//         setError(err.message || "Unable to load chat. Please try again.");
//         toast.error(err.message || "Unable to load chat.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     validateChat();
//   }, [chatId]);

//   if (loading) return <Loader />;
//   if (error) {
//     return (
//       <div className={styles.invalidChat}>
//         <p>⚠️ {error}</p>
//         <button onClick={() => router.push("/chats")}>Go to Chat List</button>
//       </div>
//     );
//   }

//   return (
//     <div className={styles.chatPage}>
//       <TopBar />
//       <div className={styles.content}>
//         <aside className={styles.chatListSidebar}>
//           <ChatList currentChatId={chatId as string} />
//         </aside>
//         <main className={styles.chatDetails}>
//           <ChatDetails chatId={chatId as string} />
//         </main>
//       </div>
//       <BottomBar />
//     </div>
//   );
// }
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import ChatPage from "."; // Import the /chats page

export default function ChatIdPage() {
  const router = useRouter();
  const { chatId } = router.query;
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (chatId && typeof chatId === "string" && /^[a-f0-9]{24}$/.test(chatId)) {
      if (isDev) console.log("Redirecting to /chats with chatId:", chatId);
      router.replace(
        "/chats",
        { query: { selectedChatId: chatId } },
        { shallow: true }
      );
    } else if (chatId) {
      if (isDev) console.log("Invalid chatId:", chatId);
      router.replace("/chats");
    }
  }, [chatId, router]);

  return <ChatPage />;
}
