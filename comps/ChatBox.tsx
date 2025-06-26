// // comps/ChatBox.tsx
// "use client";

// import { format } from "date-fns";
// import { useRouter } from "next/navigation";
// import { Conversation, User } from "../lib/api";

// const ChatBox = ({
//   chat,
//   currentUser,
//   currentChatId,
// }: {
//   chat: Conversation;
//   currentUser: User | null;
//   currentChatId?: string;
// }) => {
//   const otherMembers = chat?.members?.filter(
//     (member) => member.userId !== currentUser?.id
//   );
//   const lastMessage = chat?.lastMessage;
//   const seen = lastMessage?.isRead;
//   const router = useRouter();

//   // Validate date before formatting
//   const formatTimestamp = (timestamp: Date | string | undefined): string => {
//     if (!timestamp) return "";
//     const date = new Date(timestamp);
//     return isNaN(date.getTime()) ? "" : format(date, "p");
//   };

//   return (
//     <div
//       className={`chat-box ${chat.id === currentChatId ? "bg-blue-2" : ""}`}
//       onClick={() => router.push(`/chats/${chat.id}`)}
//     >
//       <div className="chat-info">
//         {chat?.isGroupChat ? (
//           <img
//             src="/assets/group.png" // No groupPhoto; using default
//             alt="group-photo"
//             className="profilePhoto"
//           />
//         ) : (
//           <img
//             src="/assets/person.png" // No profilePicture; using default
//             alt="profile-photo"
//             className="profilePhoto"
//           />
//         )}
//         <div className="flex flex-col gap-1">
//           {chat?.isGroupChat ? (
//             <p className="text-base-bold">{chat?.groupName}</p>
//           ) : (
//             <p className="text-base-bold">{otherMembers[0]?.name}</p>
//           )}
//           {!lastMessage && <p className="text-small-bold">Started a chat</p>}
//           {lastMessage && (
//             <p
//               className={`last-message ${
//                 seen ? "text-small-medium text-grey-3" : "text-small-bold"
//               }`}
//             >
//               {lastMessage?.content}
//             </p>
//           )}
//         </div>
//       </div>
//       <div>
//         <p className="text-base-light text-grey-3">
//           {lastMessage
//             ? formatTimestamp(lastMessage.timestamp)
//             : formatTimestamp(chat.createdAt)}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default ChatBox;

// comps/ChatBox.tsx
// "use client";

// import { format } from "date-fns";
// import { useRouter } from "next/navigation";
// import { Conversation, User } from "../lib/api";
// import styles from "../styles/ChatBox.module.css";

// const ChatBox = ({
//   chat,
//   currentUser,
//   currentChatId,
// }: {
//   chat: Conversation;
//   currentUser: User | null;
//   currentChatId?: string;
// }) => {
//   const otherMembers = chat?.members?.filter(
//     (member) => member.userId !== currentUser?.id
//   );
//   const lastMessage = chat?.lastMessage;
//   const seen = lastMessage?.isRead;
//   const router = useRouter();

//   // Validate date before formatting
//   const formatTimestamp = (timestamp: Date | string | undefined): string => {
//     if (!timestamp) return "";
//     const date = new Date(timestamp);
//     return isNaN(date.getTime()) ? "" : format(date, "p");
//   };

//   return (
//     <div
//       className={`${styles["chat-box"]} ${
//         chat.id === currentChatId ? styles["bg-blue-2"] : ""
//       }`}
//       onClick={() => router.push(`/chats/${chat.id}`)}
//     >
//       <div className={styles["chat-info"]}>
//         {chat?.isGroupChat ? (
//           <img
//             src="/assets/group.png"
//             alt="group-photo"
//             className={styles.profilePhoto}
//           />
//         ) : (
//           <img
//             src="/assets/person.png"
//             alt="profile-photo"
//             className={styles.profilePhoto}
//           />
//         )}
//         <div className="flex flex-col gap-1">
//           {chat?.isGroupChat ? (
//             <p className={styles["text-base-bold"]}>{chat?.groupName}</p>
//           ) : (
//             <p className={styles["text-base-bold"]}>{otherMembers[0]?.name}</p>
//           )}
//           {!lastMessage && (
//             <p className={styles["text-small-bold"]}>
//               Say hi 👋 to {otherMembers[0]?.name}{" "}
//             </p>
//           )}
//           {lastMessage && (
//             <p
//               className={`${styles["last-message"]} ${
//                 seen
//                   ? `${styles["text-small-medium"]} ${styles["text-grey-3"]}`
//                   : styles["text-small-bold"]
//               }`}
//             >
//               {lastMessage?.content}
//             </p>
//           )}
//         </div>
//       </div>
//       <div>
//         <p className={`${styles["text-base-light"]} ${styles["text-grey-3"]}`}>
//           {lastMessage
//             ? formatTimestamp(lastMessage.timestamp)
//             : formatTimestamp(chat.createdAt)}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default ChatBox;
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// comps/ChatBox.tsx
// "use client";

// import { format, isValid } from "date-fns";
// import { User, Conversation } from "../lib/api";
// import styles from "../styles/ChatList.module.css";

// interface ChatBoxProps {
//   chat: Conversation;
//   currentUser: User | null;
//   currentChatId?: string;
//   onChatSelect?: (chatId: string) => void;
// }

// const ChatBox = ({
//   chat,
//   currentUser,
//   currentChatId,
//   onChatSelect,
// }: ChatBoxProps) => {
//   const isDev = process.env.NODE_ENV === "development";

//   // Debug log
//   if (isDev) {
//     console.log("ChatBox props:", {
//       chatId: chat.id,
//       currentChatId,
//       typeofChatId: typeof chat.id,
//     });
//   }

//   // Type guard for chat.id
//   if (!chat.id) {
//     console.warn("Chat with undefined id detected in ChatBox:", chat);
//     return null;
//   }

//   const otherMembers = chat.members?.filter(
//     (member) => member.userId !== currentUser?.id
//   );
//   const lastMessage = chat.lastMessage;
//   const seen = lastMessage?.isRead;

//   // Format timestamp
//   const formatTimestamp = (
//     timestamp: Date | string | number | undefined
//   ): string => {
//     if (isDev) {
//       console.log("ChatBox timestamp debug:", {
//         timestamp,
//         type: typeof timestamp,
//         isNullOrEmpty:
//           timestamp == null ||
//           (typeof timestamp === "string" && !timestamp.trim()),
//       });
//     }
//     if (
//       !timestamp ||
//       (typeof timestamp === "string" &&
//         (!timestamp.trim() ||
//           timestamp === "null" ||
//           timestamp === "undefined"))
//     ) {
//       return "";
//     }
//     const date =
//       typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
//     return isValid(date) ? format(date, "p") : "";
//   };

//   const chatName = chat.isGroupChat
//     ? chat.groupName
//     : otherMembers[0]?.name || "Unnamed Chat";
//   const profilePhoto = chat.isGroupChat
//     ? "/assets/group.png"
//     : otherMembers[0]?.profilePicture || "/assets/person.png";

//   const handleClick = () => {
//     if (isDev) console.log("ChatBox clicked:", chat.id);
//     if (onChatSelect) {
//       onChatSelect(chat.id);
//     }
//   };

//   const timestamp = formatTimestamp(
//     lastMessage ? lastMessage.timestamp : chat.createdAt
//   );

//   return (
//     <div
//       className={`${styles.chatBox} ${
//         currentChatId && currentChatId === chat.id ? styles.chatBoxActive : ""
//       }`}
//       onClick={handleClick}
//       role="button"
//       tabIndex={0}
//       onKeyPress={(e) => e.key === "Enter" && handleClick()}
//       aria-label={`Open chat with ${chatName}`}
//     >
//       <div className={styles.chatInfo}>
//         <img
//           src={profilePhoto}
//           alt={`${chatName} profile`}
//           className={styles.profilePhoto}
//           onError={(e) => (e.currentTarget.src = "/assets/person.png")}
//         />
//         <div className="flex flex-col gap-1">
//           <p className={styles.textBaseBold}>{chatName}</p>
//           {!lastMessage && (
//             <p className={styles.textSmallBold}>Say hi 👋 to {chatName}</p>
//           )}
//           {lastMessage && (
//             <p
//               className={`${styles.lastMessage} ${
//                 seen
//                   ? `${styles.textSmallMedium} ${styles.textGrey3}`
//                   : styles.textSmallBold
//               }`}
//             >
//               {lastMessage.content}
//             </p>
//           )}
//         </div>
//       </div>
//       <div>
//         {timestamp && (
//           <p className={`${styles.textBaseLight} ${styles.textGrey3}`}>
//             {timestamp}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatBox;

// comps/ChatBox.tsx
import { format, isValid } from "date-fns";
import { User, Conversation } from "../lib/api";
import styles from "../styles/ChatList.module.css";

interface ChatBoxProps {
  chat: Conversation;
  currentUser: User | null;
  currentChatId?: string;
  onChatSelect?: (chatId: string) => void;
}

const ChatBox = ({
  chat,
  currentUser,
  currentChatId,
  onChatSelect,
}: ChatBoxProps) => {
  const isDev = process.env.NODE_ENV === "development";

  if (!chat.id) {
    console.warn("Chat with undefined id detected in ChatBox:", chat);
    return null;
  }

  const otherMembers = chat.members?.filter(
    (member) => member.userId !== currentUser?.id
  );
  const lastMessage = chat.lastMessage;
  const seen = lastMessage?.isRead;

  // const formatTimestamp = (
  //   timestamp: Date | string | number | undefined
  // ): string => {
  //   if (isDev) {
  //     console.log("ChatBox timestamp debug:", {
  //       chatId: chat.id,
  //       timestamp,
  //       type: typeof timestamp,
  //       isNullOrEmpty:
  //         !timestamp || (typeof timestamp === "string" && !timestamp.trim()),
  //       source: lastMessage ? "lastMessage" : "createdAt",
  //       rawChat: JSON.stringify(chat, null, 2),
  //     });
  //   }
  //   if (
  //     !timestamp ||
  //     (typeof timestamp === "string" &&
  //       (!timestamp.trim() ||
  //         timestamp === "null" ||
  //         timestamp === "undefined"))
  //   ) {
  //     return ""; // Hide timestamp for new chats
  //   }
  //   const date =
  //     typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  //   return isValid(date) ? format(date, "p") : "";
  // };
  const formatTimestamp = (
    timestamp: Date | string | number | null | undefined
  ): string => {
    if (isDev) {
      console.log("ChatBox timestamp debug:", {
        chatId: chat.id,
        timestamp,
        type: typeof timestamp,
        isNullOrEmpty:
          !timestamp || (typeof timestamp === "string" && !timestamp.trim()),
        source: lastMessage ? "lastMessage" : "createdAt",
        rawChat: JSON.stringify(chat, null, 2),
      });
    }
    if (
      !timestamp ||
      timestamp === null ||
      (typeof timestamp === "string" &&
        (!timestamp.trim() ||
          timestamp === "null" ||
          timestamp === "undefined"))
    ) {
      return ""; // Hide timestamp for new chats
    }
    const date =
      typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
    return isValid(date) ? format(date, "p") : "";
  };

  const chatName = chat.isGroupChat
    ? chat.groupName
    : otherMembers[0]?.name || "Unnamed Chat";
  const profilePhoto = chat.isGroupChat
    ? "/assets/group.png"
    : otherMembers[0]?.profilePicture || "/assets/person.png";

  const handleClick = () => {
    if (isDev) console.log("ChatBox clicked:", chat.id);
    if (onChatSelect) {
      onChatSelect(chat.id);
    }
  };

  const timestamp = formatTimestamp(
    lastMessage ? lastMessage.timestamp : chat.createdAt
  );

  return (
    <div
      className={`${styles.chatBox} ${
        currentChatId && currentChatId === chat.id ? styles.chatBoxActive : ""
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && handleClick()}
      aria-label={`Open chat with ${chatName}`}
    >
      <div className={styles.chatInfo}>
        <img
          src={profilePhoto}
          alt={`${chatName} profile`}
          className={styles.profilePhoto}
          onError={(e) => (e.currentTarget.src = "/assets/person.png")}
        />
        <div className="flex flex-col gap-1">
          <p className={styles.textBaseBold}>{chatName}</p>
          {!lastMessage && (
            <p className={styles.textSmallBold}>Say hi 👋 to {chatName}</p>
          )}
          {lastMessage && (
            <p
              className={`${styles.lastMessage} ${
                seen
                  ? `${styles.textSmallMedium} ${styles.textGrey3}`
                  : styles.textSmallBold
              }`}
            >
              {lastMessage.content}
            </p>
          )}
        </div>
      </div>
      <div>
        {timestamp && (
          <p className={`${styles.textBaseLight} ${styles.textGrey3}`}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
