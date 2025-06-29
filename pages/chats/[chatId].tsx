// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/router";
// import ChatPage from "."; // Import the /chats page

// export default function ChatIdPage() {
//   const router = useRouter();
//   const { chatId } = router.query;
//   const isDev = process.env.NODE_ENV === "development";

//   useEffect(() => {
//     if (chatId && typeof chatId === "string" && /^[a-f0-9]{24}$/.test(chatId)) {
//       if (isDev) console.log("Redirecting to /chats with chatId:", chatId);
//       router.replace(
//         "/chats",
//         { query: { selectedChatId: chatId } },
//         { shallow: true }
//       );
//     } else if (chatId) {
//       if (isDev) console.log("Invalid chatId:", chatId);
//       router.replace("/chats");
//     }
//   }, [chatId, router]);

//   return <ChatPage />;
// }

// pages/chats/[chatId].tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ChatIdRedirectPage() {
  const router = useRouter();
  const { chatId } = router.query;

  useEffect(() => {
    if (typeof chatId === "string") {
      router.replace(`/chats?selectedChatId=${chatId}`);
    }
  }, [chatId]);

  return null; // 🧼 Render nothing
}
