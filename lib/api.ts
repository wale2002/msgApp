import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { emitMessageSent, emitNewChat } from "./events";

const api = axios.create({
  baseURL: "https://fifthlab-collaboration.onrender.com",
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Interceptor set token:", token.substring(0, 10) + "...");
      }
    }
    config.startTime = Date.now();
    return config;
  },
  (error) => {
    console.error("Interceptor error:", error);
    return Promise.reject(error);
  }
);

const retryRequest = async <T>(
  fn: () => Promise<AxiosResponse<T>>,
  retries = 2,
  delay = 1000
): Promise<AxiosResponse<T>> => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries || !error.message.includes("Network Error"))
        throw error;
      console.warn(
        `Retry ${i + 1}/${retries} after ${delay}ms due to ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Max retries reached");
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      console.log("401 error, redirecting to /auth");
      localStorage.removeItem("authToken");
      setAuthToken();
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("Auth token set:", token.substring(0, 10) + "...");
  } else {
    delete api.defaults.headers.common["Authorization"];
    console.log("Auth token removed");
  }
};

export const loadAuthToken = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    setAuthToken(token);
    console.log(
      "Loaded token from localStorage:",
      token.substring(0, 10) + "..."
    );
  } else {
    console.log("No token found in localStorage");
  }
};

export const saveAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
  setAuthToken(token);
  console.log("Saved token:", token.substring(0, 10) + "...");
};

export interface User {
  id: string;
  name?: string;
  email?: string;
  profilePicture?: string;
}

export interface ExtendedUser extends User {
  accountName?: string;
  firstName?: string;
  lastName?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  status?: string;
  data?: T;
  token?: string;
  message?: string;
  results?: number;
}

export interface Member {
  userId: string;
  name: string;
  unreadCount: number;
  profilePicture?: string;
}

export interface Conversation {
  id: string;
  _id?: string;
  isGroupChat: boolean;
  groupName?: string;
  members: Array<{
    userId: string;
    name: string;
    unreadCount: number;
  }>;
  lastMessage?: {
    content: string;
    timestamp: string | null;
    isRead: boolean;
  } | null;
  createdAt?: Date | string;
  groupAdmin?: string[];

  // ✅ Add this line:
  isArchived?: boolean;
  totalMessages?: number;
}

export interface Message {
  id: string;
  sender: string;
  senderName: string;
  senderPhoto?: string;
  content: string;
  photo?: string;
  timestamp: string;
  isRead: boolean;
  tempId?: string;
  isDeleted?: boolean;
  isOptimistic?: boolean; // Add optional isOptimistic property
  createdAt?: string; // ✅ add this
}

export const login = async (data: { email: string; password: string }) => {
  try {
    const start = Date.now();
    const res = await api.post<ApiResponse<ExtendedUser>>(
      "/api/v1/users/login",
      data
    );
    console.log(
      `Login response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    if (res.data.success && res.data.token) {
      saveAuthToken(res.data.token);
      setAuthToken(res.data.token);
      console.log("Token set from response body");
    } else {
      console.log(
        "No token in response body, relying on cookie-based authentication"
      );
    }
    return res;
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export const signup = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  accountName: string;
  password: string;
}) => {
  try {
    const start = Date.now();
    const res = await api.post<ApiResponse<ExtendedUser>>(
      "/api/v1/users/signup",
      data
    );
    console.log(
      `Signup response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    if (res.data.success && res.data.token) {
      saveAuthToken(res.data.token);
      setAuthToken(res.data.token);
      console.log("Token set from response body");
    } else {
      console.log(
        "No token in response, relying on cookie-based authentication"
      );
    }
    return res;
  } catch (error: any) {
    console.error("Signup error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Signup failed");
  }
};

export const logout = async () => {
  try {
    const start = Date.now();
    const res = await api.get<ApiResponse>("/api/v1/users/logout");
    console.log(
      `Logout response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    setAuthToken();
    return res;
  } catch (error: any) {
    console.error("Logout error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Logout failed");
  }
};

export const forgotPassword = async (data: { email: string }) => {
  try {
    const start = Date.now();
    const res = await api.post<ApiResponse>(
      "/api/v1/users/forgotPassword",
      data
    );
    console.log(
      `ForgotPassword response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    return res;
  } catch (error: any) {
    console.error(
      "ForgotPassword error:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Forgot password failed");
  }
};

export const resetPassword = async (
  token: string,
  data: { password: string }
) => {
  try {
    const start = Date.now();
    const res = await api.patch<ApiResponse<ExtendedUser>>(
      `/api/v1/users/resetPassword/${token}`,
      data
    );
    console.log(
      `ResetPassword response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    if (res.data.success && res.data.token) {
      saveAuthToken(res.data.token);
      setAuthToken(res.data.token);
    }
    return res;
  } catch (error: any) {
    console.error(
      "ResetPassword error:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Reset password failed");
  }
};

export const getUsers = async () => {
  try {
    const start = Date.now();
    const res = await api.get<ApiResponse<{ users: ExtendedUser[] }>>(
      "/api/v1/messages/users"
    );
    console.log(
      `getUsers response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    return res;
  } catch (error: any) {
    console.error("getUsers error:", error.response?.data || error.message);
    throw error;
  }
};

export const getMe = async (): Promise<
  AxiosResponse<ApiResponse<ExtendedUser>>
> => {
  try {
    loadAuthToken();
    const start = Date.now();
    const res = await retryRequest(() =>
      api.get<ApiResponse<ExtendedUser>>("/api/v1/users/me")
    );
    console.log(
      `getMe response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    return res;
  } catch (error: any) {
    console.error("getMe error:", error.response?.data || error.message);
    throw error;
  }
};

export const getChats = async () => {
  try {
    const start = Date.now();
    const res = await api.get<ApiResponse<Conversation[]>>(
      "/api/v1/messages/chats"
    );
    console.log(
      `getChats response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    console.log(
      "getChats timestamps:",
      res.data.data?.map((chat) => ({
        id: chat.id,
        timestamp: chat.lastMessage?.timestamp,
      }))
    );
    if (!res.data.data) {
      console.warn("No chats in response, returning empty array");
      return {
        ...res,
        data: {
          ...res.data,
          data: [],
        },
      };
    }
    // Normalize timestamps
    const normalizedChats = res.data.data.map((chat) => ({
      ...chat,
      lastMessage: chat.lastMessage
        ? {
            ...chat.lastMessage,
            timestamp: chat.lastMessage.timestamp
              ? new Date(chat.lastMessage.timestamp).toISOString()
              : new Date().toISOString(),
          }
        : null,
      createdAt: chat.createdAt
        ? new Date(chat.createdAt).toISOString()
        : new Date().toISOString(),
    }));
    return {
      ...res,
      data: {
        ...res.data,
        data: normalizedChats,
      },
    };
  } catch (error: any) {
    console.error("getChats error:", error.response?.data || error.message);
    throw error;
  }
};

export const getMessages = async (
  chatId: string,
  params: { page?: number; limit?: number; filter?: string } = {}
) => {
  try {
    const { page = 1, limit = 20, filter } = params;
    const query = new URLSearchParams({
      chatId,
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filter) query.append("filter", filter);
    const start = Date.now();
    const res = await api.get<
      ApiResponse<{ chat: Conversation; messages: Message[] }>
    >(`/api/v1/messages?${query.toString()}`);
    console.log(
      `getMessages response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    console.log(
      "getMessages timestamps:",
      res.data.data?.messages.map((msg) => ({
        id: msg.id,
        timestamp: msg.timestamp,
      }))
    );
    if (
      res.data.status !== "success" ||
      (!res.data.success && res.data.success !== undefined)
    ) {
      console.error("getMessages failed:", {
        status: res.data.status,
        success: res.data.success,
        message: res.data.message,
        statusCode: res.status,
      });
      throw new Error(res.data.message || "Failed to fetch messages");
    }
    if (!res.data.data || !res.data.data.chat) {
      console.error(
        "No chat data in response:",
        JSON.stringify(res.data, null, 2)
      );
      throw new Error("No chat data found in response");
    }
    // Normalize timestamps
    const normalizedMessages = res.data.data.messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp
        ? new Date(msg.timestamp).toISOString()
        : new Date().toISOString(),
    }));
    const normalizedChat = {
      ...res.data.data.chat,
      lastMessage: res.data.data.chat.lastMessage
        ? {
            ...res.data.data.chat.lastMessage,
            timestamp: res.data.data.chat.lastMessage.timestamp
              ? new Date(res.data.data.chat.lastMessage.timestamp).toISOString()
              : new Date().toISOString(),
          }
        : null,
      createdAt: res.data.data.chat.createdAt
        ? new Date(res.data.data.chat.createdAt).toISOString()
        : new Date().toISOString(),
    };
    return {
      ...res,
      data: {
        ...res.data,
        data: {
          chat: normalizedChat,
          messages: normalizedMessages,
        },
      },
    };
  } catch (error: any) {
    console.error("getMessages error:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.config?.headers,
      url: error.config?.url,
      fullUrl: error.config
        ? `${error.config.baseURL}${error.config.url}`
        : undefined,
    });
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch messages"
    );
  }
};

export const createChat = async (data: {
  recipients: string[];
  isGroupChat: boolean;
  groupName?: string;
}) => {
  try {
    if (!data.recipients.length) {
      throw new Error("At least one recipient is required");
    }
    const start = Date.now();
    const res = await api.post<ApiResponse<Conversation | string>>(
      "/api/v1/messages/chats",
      data
    );
    console.log(
      `createChat response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    if (res.data.status === "fail" || !res.data.success) {
      throw new Error(res.data.message || "Failed to create chat");
    }
    if (!res.data.data) {
      console.error("No data in response:", JSON.stringify(res.data, null, 2));
      throw new Error("No chat data returned in response");
    }
    const chatId =
      typeof res.data.data === "string"
        ? res.data.data
        : res.data.data?._id || res.data.data?.id;
    if (!chatId || typeof chatId !== "string" || chatId.trim() === "") {
      console.error(
        "Invalid chatId in response:",
        JSON.stringify(res.data, null, 2)
      );
      throw new Error(
        `Invalid chat ID in response: ${JSON.stringify(res.data)}`
      );
    }
    const normalizedData: Conversation =
      typeof res.data.data === "string"
        ? {
            id: chatId,
            _id: chatId,
            isGroupChat: data.isGroupChat,
            members: [
              {
                userId: data.recipients[0],
                name: "Unknown",
                unreadCount: 0,
              },
            ],
            lastMessage: null,
            createdAt: new Date().toISOString(),
          }
        : {
            id: chatId,
            _id: res.data.data._id || chatId,
            isGroupChat: res.data.data.isGroupChat ?? false,
            groupName: res.data.data.groupName,
            members: res.data.data.members || [],
            lastMessage: res.data.data.lastMessage
              ? {
                  ...res.data.data.lastMessage,
                  timestamp: res.data.data.lastMessage.timestamp
                    ? new Date(
                        res.data.data.lastMessage.timestamp
                      ).toISOString()
                    : new Date().toISOString(),
                }
              : null,
            createdAt: res.data.data.createdAt
              ? new Date(res.data.data.createdAt).toISOString()
              : new Date().toISOString(),
            groupAdmin: res.data.data.groupAdmin || [],
          };
    emitNewChat(normalizedData);
    return {
      ...res,
      data: {
        ...res.data,
        data: normalizedData,
      },
    };
  } catch (error: any) {
    console.error("createChat error:", {
      message: error.message,
      response: error.response?.data,
      requestData: data,
    });
    throw new Error(error.message || "Failed to create chat");
  }
};

export const sendMessage = async (data: {
  chatId: string;
  content: string;
  photo?: string;
}): Promise<AxiosResponse<ApiResponse<Message>>> => {
  let currentUser: ExtendedUser | null = null;
  try {
    const userRes = await getMe();
    currentUser = userRes.data?.data || null;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
  }

  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const optimisticMessage: Message = {
    id: tempId,
    sender: currentUser?.id || "unknown-user",
    senderName:
      currentUser?.accountName ||
      `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
      "Unknown User",
    content: data.content,
    photo: data.photo,
    timestamp: new Date().toISOString(),
    isRead: false,
    tempId,
  };
  console.log("Emitting optimistic message:", { tempId, chatId: data.chatId });
  emitMessageSent(data.chatId, optimisticMessage);

  try {
    const start = Date.now();
    const res = await api.post<ApiResponse<Message>>("/api/v1/messages", data);
    console.log(`sendMessage took ${Date.now() - start}ms`, {
      status: res.data.status,
      success: res.data.success,
      data: res.data.data,
      message: res.data.message,
    });
    console.log("sendMessage timestamp:", res.data?.data?.timestamp);

    if (res.data.status !== "success" || !res.data.data) {
      console.error("Invalid response:", res.data);
      throw new Error(res.data.message || "No message data returned");
    }

    const serverMessage = res.data.data;
    if (
      !serverMessage.id ||
      !serverMessage.sender ||
      !serverMessage.senderName ||
      !serverMessage.content ||
      !serverMessage.timestamp
    ) {
      console.error("Invalid server message:", serverMessage);
      throw new Error("Invalid message data from server");
    }

    const realMessage: Message = {
      id: serverMessage.id,
      sender: serverMessage.sender,
      senderName: serverMessage.senderName,
      content: serverMessage.content,
      photo: serverMessage.photo,
      timestamp: serverMessage.timestamp,
      isRead: serverMessage.isRead ?? false,
      tempId,
    };
    console.log("Emitting real message:", {
      id: realMessage.id,
      tempId,
      chatId: data.chatId,
    });
    emitMessageSent(data.chatId, realMessage);
    return res;
  } catch (error: AxiosError | any) {
    console.error("Error sending message:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    const errorMessage: Message = {
      ...optimisticMessage,
      id: `error-${tempId}`,
    };
    emitMessageSent(data.chatId, errorMessage);
    throw error;
  }
};

export const markAsRead = async (chatId: string) => {
  try {
    const start = Date.now();
    const res = await api.patch<ApiResponse>(
      `/api/v1/messages/chats/${chatId}/markAsRead`
    );
    console.log(
      `markAsRead response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    return res;
  } catch (error: any) {
    console.error("markAsRead error:", error.response?.data || error.message);
    throw error;
  }
};

export const toggleChatArchive = async (chatId: string) => {
  try {
    const start = Date.now();
    const res = await api.patch<
      ApiResponse<{ id: string; isArchived: boolean }>
    >(`/api/v1/messages/chats/${chatId}`); // ✅ FIXED (removed /toggleArchive)

    console.log(
      `toggleChatArchive response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );
    return res;
  } catch (error: any) {
    console.error(
      "toggleChatArchive error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to toggle chat archive status"
    );
  }
};
export const deleteChat = async (
  chatId: string
): Promise<AxiosResponse<ApiResponse<{ chatId: string }>>> => {
  try {
    const start = Date.now();
    const res = await api.delete<ApiResponse<{ chatId: string }>>(
      `/api/v1/messages/chats/${chatId}`
    );
    console.log(
      `deleteChat response: ${JSON.stringify(res.data, null, 2)}`,
      `Took ${Date.now() - start}ms`
    );

    if (!res.data.success) {
      console.error("deleteChat failed:", {
        status: res.data.status,
        success: res.data.success,
        message: res.data.message,
        statusCode: res.status,
      });
      throw new Error(res.data.message || "Failed to delete chat");
    }
    return res;
  } catch (error: any) {
    console.error("deleteChat error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.config?.headers,
      url: error.config?.url,
      fullUrl: error.config
        ? `${error.config.baseURL}${error.config.url}`
        : undefined,
    });
    throw new Error(
      error.response?.data?.message || error.message || "Failed to delete chat"
    );
  }
};

// export const deleteMessage = async (
//   messageId: string
// ): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
//   try {
//     console.log(`Deleting message with ID: ${messageId}`); // Log the message ID being deleted
//     const res = await api.delete(`/api/v1/messages/${messageId}`);
//     console.log("Response:", res); // Log the entire response object

//     // Check the response status and format it according to what the component expects
//     if (res.data.status === "success") {
//       console.log("Message deleted successfully:", res.data.message);
//       return {
//         ...res,
//         data: { success: true, message: res.data.message },
//       };
//     } else {
//       console.log("Delete message failed:", res.data.message);
//       return {
//         ...res,
//         data: { success: false, message: res.data.message },
//       };
//     }
//   } catch (error: any) {
//     // Enhanced error logging for debugging
//     console.error("❌ deleteMessage error: ", {
//       message: error.message, // Log the main error message
//       response: error.response?.data, // Log any response data
//       status: error.response?.status, // Log the status code
//       url: error.config?.url, // Log the URL of the request
//       headers: error.config?.headers, // Log the request headers for debugging
//     });

//     // Provide a more detailed error message for the client
//     throw new Error(
//       error.response?.data?.message ||
//         error.message ||
//         "Failed to delete message"
//     );
//   }
// };

export const deleteMessage = async (
  messageId: string
): Promise<
  AxiosResponse<{
    success: boolean;
    message: string;
    data: { messageId: string };
  }>
> => {
  try {
    const res = await api.delete(`/api/v1/messages/${messageId}`);
    if (res.data.status === "success") {
      return {
        ...res,
        data: {
          success: true,
          message: res.data.message,
          data: { messageId: res.data.data.messageId },
        },
      };
    } else {
      throw new Error(res.data.message || "Failed to delete message");
    }
  } catch (err: any) {
    console.error("deleteMessage error", {
      message: err.message,
      response: err.response?.data,
    });
    throw new Error(err.response?.data?.message || err.message);
  }
};

export default api;
