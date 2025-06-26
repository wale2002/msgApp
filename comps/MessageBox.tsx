// comps/MessageBox.tsx
"use client";

import { format, isValid } from "date-fns";
import { CldImage } from "next-cloudinary";
import { Message, User } from "../lib/api";
import styles from "../styles/MessageBox.module.css";

interface MessageBoxProps {
  message: Message;
  currentUser: User | null; // Allow null
}

const MessageBox = ({ message, currentUser }: MessageBoxProps) => {
  const isDev = process.env.NODE_ENV === "development";
  const isSentByCurrentUser = currentUser
    ? message.sender === currentUser.id
    : false;

  if (isDev) {
    console.log("MessageBox render:", {
      messageId: message.id,
      sender: message.sender,
      currentUserId: currentUser?.id,
      isSentByCurrentUser,
    });
  }

  const getFormattedTime = (
    timestamp: string | Date | number | null | undefined
  ) => {
    if (isDev) {
      console.log("MessageBox timestamp debug:", {
        messageId: message.id,
        timestamp,
        type: typeof timestamp,
        isNullOrEmpty:
          timestamp == null ||
          (typeof timestamp === "string" && !timestamp.trim()),
        rawMessage: JSON.stringify(message, null, 2),
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
        {isSentByCurrentUser && formattedTime && (
          <span className={styles.messageTime}>{formattedTime}</span>
        )}
      </div>
    </div>
  );
};

export default MessageBox;
