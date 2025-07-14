import { format, isValid } from "date-fns";
import { User, Conversation } from "../lib/api";
import styles from "../styles/ChatList.module.css";
import { useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Menu, MenuItem, IconButton } from "@mui/material";

interface ChatBoxProps {
  chat: Conversation;
  currentUser: User | null;
  currentChatId?: string;
  onDeleteChat?: (chatId: string) => void;
  onChatSelect?: (chatId: string) => void;
  onToggleArchive?: (chatId: string) => void;
}

const ChatBox = ({
  chat,
  currentUser,
  currentChatId,
  onChatSelect,
  onToggleArchive,
  onDeleteChat,
}: ChatBoxProps) => {
  const isDev = process.env.NODE_ENV === "development";
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!chat.id) {
    console.warn("Chat with undefined id detected in ChatBox:", chat);
    return null;
  }

  const otherMembers = chat.members?.filter(
    (member) => member.userId !== currentUser?.id
  );
  const lastMessage = chat.lastMessage;
  const seen = lastMessage?.isRead;

  const formatTimestamp = (
    timestamp: Date | string | number | null | undefined
  ): string => {
    if (
      !timestamp ||
      timestamp === null ||
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

  const chatName = chat.isGroupChat
    ? chat.groupName
    : otherMembers[0]?.name || "....";
  const profilePhoto = chat.isGroupChat
    ? "/assets/group.png"
    : (
        otherMembers[0] as {
          userId: string;
          name: string;
          profilePicture?: string;
        }
      )?.profilePicture || "/assets/person.png";

  const handleClick = () => {
    if (isDev) console.log("ChatBox clicked:", chat.id);
    if (onChatSelect) {
      onChatSelect(chat.id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick
    if (onToggleArchive) {
      onToggleArchive(chat.id);
    }
    handleMenuClose();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick
    if (onDeleteChat) {
      onDeleteChat(chat.id);
    }
    handleMenuClose();
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

      <div className={styles.chatBoxRight}>
        {timestamp && (
          <p className={`${styles.textBaseLight} ${styles.textGrey3}`}>
            {timestamp}
          </p>
        )}
        <IconButton
          aria-label="Chat options"
          aria-controls={open ? `menu-${chat.id}` : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleMenuClick}
          className={styles.menuButton}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id={`menu-${chat.id}`}
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{
            "aria-labelledby": `menu-button-${chat.id}`,
          }}
        >
          <MenuItem onClick={handleArchiveClick}>
            {chat.isArchived ? "Unarchive" : "Archive"}
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
        </Menu>
      </div>
    </div>
  );
};

export default ChatBox;
