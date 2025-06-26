// import { Conversation, Message } from "./api";

// export const emitMessageSent = (chatId: string, message?: Message) => {
//   console.log("emitMessageSent:", { chatId, message });
//   const event = new CustomEvent("message-sent", {
//     detail: { chatId, message },
//   });
//   window.dispatchEvent(event);
// };

// export const onMessageSent = (
//   callback: (data: { chatId: string; message?: Message }) => void
// ) => {
//   const handler = (event: Event) => {
//     const customEvent = event as CustomEvent<{
//       chatId: string;
//       message?: Message;
//     }>;
//     callback(customEvent.detail);
//   };
//   window.addEventListener("message-sent", handler);
//   return () => window.removeEventListener("message-sent", handler);
// };

// export const emitNewChat = (chat: Conversation) => {
//   console.log("emitNewChat:", chat);
//   const event = new CustomEvent("new-chat", { detail: chat });
//   window.dispatchEvent(event);
// };

// export const onNewChat = (callback: (chat: Conversation) => void) => {
//   const handler = (event: Event) => {
//     const customEvent = event as CustomEvent<Conversation>;
//     callback(customEvent.detail);
//   };
//   window.addEventListener("new-chat", handler);
//   return () => window.removeEventListener("new-chat", handler);
// };

// lib/events.ts
// import Pusher from "pusher-js";
// import { Conversation, Message } from "./api";

// let pusher: Pusher | null = null;

// export const initPusher = () => {
//   if (!pusher) {
//     pusher = new Pusher(
//       process.env.NEXT_PUBLIC_PUSHER_KEY || "836f3176a2c384401b6a",
//       {
//         cluster: "mt1",
//         forceTLS: true,
//       }
//     );
//     console.log("Pusher initialized");
//   }
//   return pusher;
// };

// export const subscribeToChat = (chatId: string) => {
//   const pusher = initPusher();
//   const channel = pusher.subscribe(`chat-${chatId}`);
//   channel.bind("new-message", (data: Message) => {
//     console.log("Pusher new-message:", data);
//     emitMessageSent(chatId, data);
//   });
//   channel.bind("pusher:subscription_error", (error: any) => {
//     console.error("Pusher subscription error:", error);
//   });
//   return () => pusher.unsubscribe(`chat-${chatId}`);
// };

// export const subscribeToChats = () => {
//   const pusher = initPusher();
//   const channel = pusher.subscribe("chats");
//   channel.bind("message-sent", (data: { chatId: string }) => {
//     console.log("Pusher message-sent:", data);
//     // Optionally trigger getChats
//   });
//   channel.bind("new-chat", (data: Conversation) => {
//     console.log("Pusher new-chat:", data);
//     emitNewChat(data);
//   });
//   return () => pusher.unsubscribe("chats");
// };

// export const emitMessageSent = (chatId: string, message?: Message) => {
//   console.log("emitMessageSent:", { chatId, message });
//   const event = new CustomEvent("message-sent", {
//     detail: { chatId, message },
//   });
//   window.dispatchEvent(event);
// };

// export const onMessageSent = (
//   callback: (data: { chatId: string; message?: Message }) => void
// ) => {
//   const handler = (event: Event) => {
//     const customEvent = event as CustomEvent<{
//       chatId: string;
//       message?: Message;
//     }>;
//     callback(customEvent.detail);
//   };
//   window.addEventListener("message-sent", handler);
//   return () => window.removeEventListener("message-sent", handler);
// };

// export const emitNewChat = (chat: Conversation) => {
//   console.log("emitNewChat:", chat);
//   const event = new CustomEvent("new-chat", { detail: chat });
//   window.dispatchEvent(event);
// };

// export const onNewChat = (callback: (chat: Conversation) => void) => {
//   const handler = (event: Event) => {
//     const customEvent = event as CustomEvent<Conversation>;
//     callback(customEvent.detail);
//   };
//   window.addEventListener("new-chat", handler);
//   return () => window.removeEventListener("new-chat", handler);
// };

// lib/events.ts
// lib/events.ts
// import Pusher from "pusher-js";
// import { Conversation, Message } from "./api";

// let pusher: Pusher | null = null;
// const messageIds = new Set<string>(); // Track processed messages

// export const initPusher = () => {
//   if (!pusher) {
//     pusher = new Pusher(
//       process.env.NEXT_PUBLIC_PUSHER_KEY || "836f3176a2c384401b6a",
//       {
//         cluster: "mt1",
//         forceTLS: true,
//       }
//     );
//     console.log("Pusher initialized");
//   }
//   return pusher;
// };

// export const subscribeToChat = (chatId: string) => {
//   const pusher = initPusher();
//   const channel = pusher.subscribe(`chat-${chatId}`);
//   channel.bind("new-message", (data: Message) => {
//     if (!data?.id || messageIds.has(data.id)) {
//       console.warn("Invalid or duplicate Pusher message:", data);
//       return;
//     }
//     messageIds.add(data.id);
//     console.log("Pusher new-message:", {
//       chatId,
//       messageId: data.id,
//       tempId: data.tempId,
//     });
//     emitMessageSent(chatId, data);
//   });
//   channel.bind("pusher:subscription_error", (error: any) => {
//     console.error("Pusher subscription error:", error);
//   });
//   return () => {
//     pusher.unsubscribe(`chat-${chatId}`);
//     channel.unbind_all();
//   };
// };

// export const subscribeToChats = () => {
//   const pusher = initPusher();
//   const channel = pusher.subscribe("chats");
//   channel.bind("message-sent", (data: { chatId: string }) => {
//     console.log("Pusher message-sent:", data);
//   });
//   channel.bind("new-chat", (data: Conversation) => {
//     console.log("Pusher new-chat:", data);
//     emitNewChat(data);
//   });
//   return () => pusher.unsubscribe("chats");
// };

// export const emitMessageSent = (chatId: string, message: Message) => {
//   if (messageIds.has(message.id)) {
//     console.warn("Duplicate emitMessageSent:", {
//       chatId,
//       messageId: message.id,
//     });
//     return;
//   }
//   messageIds.add(message.id);
//   console.log("emitMessageSent:", {
//     chatId,
//     messageId: message.id,
//     tempId: message.tempId,
//   });
//   const event = new CustomEvent("message-sent", {
//     detail: { chatId, message },
//   });
//   window.dispatchEvent(event);
// };

// export const onMessageSent = (
//   callback: (data: { chatId: string; message: Message }) => void
// ) => {
//   const handler = (event: Event) => {
//     const customEvent = event as CustomEvent<{
//       chatId: string;
//       message: Message;
//     }>;
//     callback(customEvent.detail);
//   };
//   window.addEventListener("message-sent", handler);
//   return () => window.removeEventListener("message-sent", handler);
// };

// export const emitNewChat = (chat: Conversation) => {
//   console.log("emitNewChat:", chat);
//   const event = new CustomEvent("new-chat", { detail: chat });
//   window.dispatchEvent(event);
// };

// export const onNewChat = (callback: (chat: Conversation) => void) => {
//   const handler = (event: Event) => {
//     const customEvent = event as CustomEvent<Conversation>;
//     callback(customEvent.detail);
//   };
//   window.addEventListener("new-chat", handler);
//   return () => window.removeEventListener("new-chat", handler);
// };

// lib/events.ts
import Pusher from "pusher-js";
import { Conversation, Message } from "./api";

let pusher: Pusher | null = null;
const messageIds = new Set<string>(); // Track processed messages

export const initPusher = () => {
  if (!pusher) {
    pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "836f3176a2c384401b6a",
      {
        cluster: "mt1",
        forceTLS: true,
      }
    );
    console.log("Pusher initialized");
  }
  return pusher;
};

export const subscribeToChat = (chatId: string) => {
  const pusher = initPusher();
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
    console.error("Pusher subscription error:", error);
  });
  return () => {
    channel.unbind_all();
    pusher.unsubscribe(`chat-${chatId}`);
  };
};

export const subscribeToChats = () => {
  const pusher = initPusher();
  const channel = pusher.subscribe("chats");
  channel.bind("message-sent", (data: { chatId: string }) => {
    console.log("Pusher message-sent:", data);
  });
  channel.bind("new-chat", (data: Conversation) => {
    console.log("Pusher new-chat:", data);
    emitNewChat(data);
  });
  return () => pusher.unsubscribe("chats");
};

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

export const emitNewChat = (chat: Conversation) => {
  console.log("emitNewChat:", chat);
  const event = new CustomEvent("new-chat", { detail: chat });
  window.dispatchEvent(event);
};

export const onNewChat = (callback: (chat: Conversation) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<Conversation>;
    callback(customEvent.detail);
  };
  window.addEventListener("new-chat", handler);
  return () => window.removeEventListener("new-chat", handler);
};
