import Pusher from "pusher-js";
import { Conversation, Message, ExtendedUser } from "./api";

let pusher: Pusher | null = null;
const messageIds = new Set<string>(); // Track processed messages

// Initialize Pusher instance
export const initPusher = () => {
  if (!pusher) {
    const apiKey =
      process.env.NEXT_PUBLIC_PUSHER_API_KEY || "836f3176a2c384401b6a";
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";
    if (!apiKey || !cluster) {
      console.error("Pusher configuration missing");
      return null;
    }
    try {
      pusher = new Pusher(apiKey, {
        cluster,
        forceTLS: true,
      });
      console.log("Pusher initialized successfully");
      pusher.connection.bind("error", (err: any) => {
        console.error("Pusher connection error:", err);
      });
    } catch (err) {
      console.error("Failed to initialize Pusher:", err);
      return null;
    }
  }
  return pusher;
};

// Subscribe to a specific chat channel for new messages
export const subscribeToChat = (chatId: string) => {
  const pusher = initPusher();
  if (!pusher) {
    console.error("Pusher not initialized, cannot subscribe to chat:", chatId);
    return () => {};
  }
  const channel = pusher.subscribe(`chat-${chatId}`);
  channel.bind("new-message", (data: Message) => {
    if (!data?.id) {
      console.warn("Invalid Pusher message:", data);
      return;
    }
    if (messageIds.has(data.id)) {
      console.warn("Duplicate Pusher message:", { chatId, messageId: data.id });
      return;
    }
    messageIds.add(data.id);
    console.log("Pusher new-message:", {
      chatId,
      messageId: data.id,
      tempId: data.tempId,
    });
    emitMessageSent(chatId, data);
  });
  channel.bind("pusher:subscription_error", (error: any) => {
    console.error("Pusher subscription error for chat:", { chatId, error });
  });
  return () => {
    channel.unbind_all();
    pusher.unsubscribe(`chat-${chatId}`);
  };
};

// Subscribe to the global chats channel for new chats and messages
export const subscribeToChats = () => {
  const pusher = initPusher();
  if (!pusher) {
    console.error("Pusher not initialized, cannot subscribe to chats");
    return () => {};
  }
  const channel = pusher.subscribe("chats");
  channel.bind("message-sent", (data: { chatId: string }) => {
    console.log("Pusher message-sent:", data);
  });
  channel.bind("new-chat", (data: Conversation) => {
    if (!data?.id) {
      console.warn("Invalid Pusher new-chat data:", data);
      return;
    }
    console.log("Pusher new-chat:", data);
    emitNewChat(data);
  });
  channel.bind("pusher:subscription_error", (error: any) => {
    console.error("Pusher subscription error for chats:", error);
  });
  return () => {
    channel.unbind_all();
    pusher.unsubscribe("chats");
  };
};

// Subscribe to contact updates
export const subscribeToContactUpdates = (
  callback: (contact: ExtendedUser) => void
) => {
  const pusher = initPusher();
  if (!pusher) {
    console.error("Pusher not initialized, cannot subscribe to contacts");
    return () => {};
  }
  const channel = pusher.subscribe("contacts");
  channel.bind("new-contact", (data: ExtendedUser) => {
    if (!data?.id) {
      console.warn("Invalid Pusher contact:", data);
      return;
    }
    console.log("Pusher new-contact:", data);
    callback(data);
  });
  channel.bind("pusher:subscription_error", (error: any) => {
    console.error("Pusher subscription error for contacts:", error);
  });
  return () => {
    channel.unbind_all();
    pusher.unsubscribe("contacts");
  };
};

// Emit a message-sent event
export const emitMessageSent = (chatId: string, message: Message) => {
  if (!message.id) {
    console.warn("Invalid message ID:", message);
    return;
  }
  if (messageIds.has(message.id)) {
    console.warn("Duplicate emitMessageSent:", {
      chatId,
      messageId: message.id,
    });
    return;
  }
  messageIds.add(message.id);
  console.log("emitMessageSent:", {
    chatId,
    messageId: message.id,
    tempId: message.tempId,
  });
  const event = new CustomEvent("message-sent", {
    detail: { chatId, message },
  });
  window.dispatchEvent(event);
};

// Listen for message-sent events
export const onMessageSent = (
  callback: (data: { chatId: string; message: Message }) => void
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{
      chatId: string;
      message: Message;
    }>;
    if (!customEvent.detail.message.id) {
      console.warn("Invalid onMessageSent message:", customEvent.detail);
      return;
    }
    callback(customEvent.detail);
  };
  window.addEventListener("message-sent", handler);
  return () => window.removeEventListener("message-sent", handler);
};

// Emit a new-chat event
export const emitNewChat = (chat: Conversation) => {
  if (!chat.id) {
    console.warn("Invalid chat ID:", chat);
    return;
  }
  console.log("emitNewChat:", chat);
  const event = new CustomEvent("new-chat", { detail: chat });
  window.dispatchEvent(event);
};

// Listen for new-chat events
export const onNewChat = (callback: (chat: Conversation) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<Conversation>;
    if (!customEvent.detail.id) {
      console.warn("Invalid onNewChat chat:", customEvent.detail);
      return;
    }
    callback(customEvent.detail);
  };
  window.addEventListener("new-chat", handler);
  return () => window.removeEventListener("new-chat", handler);
};

// Emit an active chat recipient event
export const emitActiveChatRecipient = (recipient: ExtendedUser | null) => {
  console.log("emitActiveChatRecipient:", recipient);
  const event = new CustomEvent("active-chat-recipient", { detail: recipient });
  window.dispatchEvent(event);
};

// Listen for active chat recipient events
export const onActiveChatRecipient = (
  callback: (recipient: ExtendedUser | null) => void
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ExtendedUser | null>;
    console.log("onActiveChatRecipient:", customEvent.detail);
    callback(customEvent.detail);
  };
  window.addEventListener("active-chat-recipient", handler);
  return () => window.removeEventListener("active-chat-recipient", handler);
};
