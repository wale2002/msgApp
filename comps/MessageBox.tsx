// // comps/MessageBox.tsx
// "use client";

// import { format, isValid } from "date-fns";
// import { CldImage } from "next-cloudinary";
// import { Message, User } from "../lib/api";
// import styles from "../styles/MessageBox.module.css";

// interface MessageBoxProps {
//   message: Message;
//   currentUser: User | null; // Allow null
// }

// const MessageBox = ({ message, currentUser }: MessageBoxProps) => {
//   const isDev = process.env.NODE_ENV === "development";
//   const isSentByCurrentUser = currentUser
//     ? message.sender === currentUser.id
//     : false;

//   if (isDev) {
//     console.log("MessageBox render:", {
//       messageId: message.id,
//       sender: message.sender,
//       currentUserId: currentUser?.id,
//       isSentByCurrentUser,
//     });
//   }

//   const getFormattedTime = (
//     timestamp: string | Date | number | null | undefined
//   ) => {
//     if (isDev) {
//       console.log("MessageBox timestamp debug:", {
//         messageId: message.id,
//         timestamp,
//         type: typeof timestamp,
//         isNullOrEmpty:
//           timestamp == null ||
//           (typeof timestamp === "string" && !timestamp.trim()),
//         rawMessage: JSON.stringify(message, null, 2),
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

//   const formattedTime = getFormattedTime(message.timestamp);

//   if (
//     !message.id ||
//     !message.sender ||
//     !message.senderName ||
//     (!message.content && !message.photo)
//   ) {
//     if (isDev) console.warn("Invalid message:", message);
//     return null;
//   }

//   return (
//     <div
//       className={`${styles.message} ${
//         isSentByCurrentUser ? styles.messageSent : styles.messageReceived
//       }`}
//     >
//       <div className={styles.messageContent}>
//         {!isSentByCurrentUser && formattedTime && (
//           <span className={styles.senderName}>
//             {message.senderName} · {formattedTime}
//           </span>
//         )}
//         {message.photo ? (
//           <CldImage
//             src={message.photo}
//             width={150}
//             height={150}
//             alt="Shared photo"
//             className={styles.messageImage}
//             crop="fill"
//             onError={(e) => (e.currentTarget.src = "/assets/placeholder.png")}
//           />
//         ) : (
//           <p>{message.content}</p>
//         )}
//         {isSentByCurrentUser && formattedTime && (
//           <span className={styles.messageTime}>{formattedTime}</span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageBox;

// "use client";

// import { format, isValid } from "date-fns";
// import { CldImage } from "next-cloudinary";
// import { Message, User } from "../lib/api";
// import styles from "../styles/MessageBox.module.css";

// interface MessageBoxProps {
//   message: Message;
//   currentUser: User | null; // Allow null
// }

// const MessageBox = ({ message, currentUser }: MessageBoxProps) => {
//   const isDev = process.env.NODE_ENV === "development";
//   const isSentByCurrentUser = currentUser
//     ? message.sender === currentUser.id
//     : false;

//   if (isDev) {
//     console.log("MessageBox render:", {
//       messageId: message.id,
//       sender: message.sender,
//       currentUserId: currentUser?.id,
//       isSentByCurrentUser,
//     });
//   }

//   // Function to format timestamp
//   const getFormattedTime = (
//     timestamp: string | Date | number | null | undefined
//   ) => {
//     if (isDev) {
//       console.log("MessageBox timestamp debug:", {
//         messageId: message.id,
//         timestamp,
//         type: typeof timestamp,
//         isNullOrEmpty:
//           timestamp == null ||
//           (typeof timestamp === "string" && !timestamp.trim()),
//         rawMessage: JSON.stringify(message, null, 2),
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

//   const formattedTime = getFormattedTime(message.timestamp);

//   // Check if the message is deleted
//   if (message.isDeleted) {
//     return (
//       <div className={`${styles.message} ${styles.messageDeleted}`}>
//         <div className={styles.messageContent}>
//           <p className={styles.deletedMessage}>This message has been deleted</p>
//         </div>
//       </div>
//     );
//   }

//   // Validate message content
//   if (
//     !message.id ||
//     !message.sender ||
//     !message.senderName ||
//     (!message.content && !message.photo)
//   ) {
//     if (isDev) console.warn("Invalid message:", message);
//     return null;
//   }

//   return (
//     <div
//       className={`${styles.message} ${
//         isSentByCurrentUser ? styles.messageSent : styles.messageReceived
//       }`}
//     >
//       <div className={styles.messageContent}>
//         {/* Display sender name and timestamp for received messages */}
//         {!isSentByCurrentUser && formattedTime && (
//           <span className={styles.senderName}>
//             {message.senderName} · {formattedTime}
//           </span>
//         )}

//         {/* Show the message content or image */}
//         {message.photo ? (
//           <CldImage
//             src={message.photo}
//             width={150}
//             height={150}
//             alt="Shared photo"
//             className={styles.messageImage}
//             crop="fill"
//             onError={(e) => (e.currentTarget.src = "/assets/placeholder.png")}
//           />
//         ) : (
//           <p>{message.content}</p>
//         )}

//         {/* Display the timestamp for sent messages */}
//         {isSentByCurrentUser && formattedTime && (
//           <span className={styles.messageTime}>{formattedTime}</span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageBox;

"use client";

import { format, isValid } from "date-fns";
import { CldImage } from "next-cloudinary";
import { Message, User } from "../lib/api";
import styles from "../styles/MessageBox.module.css";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

interface MessageBoxProps {
  message: Message;
  currentUser: User | null; // Allow null
  onDelete: (messageId: string) => void; // Handler to delete message
}

const MessageBox = ({ message, currentUser, onDelete }: MessageBoxProps) => {
  const isDev = process.env.NODE_ENV === "development";
  const isSentByCurrentUser = currentUser
    ? message.sender === currentUser.id
    : false;

  const getFormattedTime = (
    timestamp: string | Date | number | null | undefined
  ) => {
    if (isDev) {
      console.log("MessageBox timestamp debug:", {
        messageId: message.id,
        timestamp,
        type: typeof timestamp,
      });
    }

    if (
      !timestamp ||
      (typeof timestamp === "string" &&
        (!timestamp.trim() ||
          timestamp === "null" ||
          timestamp === "undefined"))
    ) {
      return "";
    }

    const date =
      typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
    return isValid(date) ? format(date, "p") : "";
  };

  const formattedTime = getFormattedTime(message.timestamp);

  if (message.isDeleted) {
    return (
      <div className={`${styles.message} ${styles.messageDeleted}`}>
        <div className={styles.messageContent}>
          <p className={styles.deletedMessage}>This message has been deleted</p>
        </div>
      </div>
    );
  }

  if (
    !message.id ||
    !message.sender ||
    !message.senderName ||
    (!message.content && !message.photo)
  ) {
    if (isDev) console.warn("Invalid message:", message);
    return null;
  }

  return (
    <div
      className={`${styles.message} ${
        isSentByCurrentUser ? styles.messageSent : styles.messageReceived
      }`}
    >
      <div className={styles.messageContent}>
        {!isSentByCurrentUser && formattedTime && (
          <span className={styles.senderName}>
            {message.senderName} · {formattedTime}
          </span>
        )}

        {message.photo ? (
          <CldImage
            src={message.photo}
            width={150}
            height={150}
            alt="Shared photo"
            className={styles.messageImage}
            crop="fill"
            onError={(e) => (e.currentTarget.src = "/assets/placeholder.png")}
          />
        ) : (
          <p>{message.content}</p>
        )}

        {isSentByCurrentUser && (
          <button
            onClick={() => onDelete(message.id)}
            className={styles.deleteButton}
            aria-label={`Delete message from ${message.senderName}`}
          >
            <DeleteOutlinedIcon />
          </button>
        )}

        {isSentByCurrentUser && formattedTime && (
          <span className={styles.messageTime}>{formattedTime}</span>
        )}
      </div>
    </div>
  );
};

export default MessageBox;
