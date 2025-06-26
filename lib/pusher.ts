// lib/pusher.ts
import Pusher from "pusher-js";

let pusherInstance: Pusher | null = null;

export const getPusherInstance = () => {
  if (!pusherInstance) {
    const apiKey = process.env.NEXT_PUBLIC_PUSHER_API_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!apiKey || !cluster) {
      console.error("Pusher configuration missing");
      return null;
    }
    try {
      pusherInstance = new Pusher(apiKey, {
        cluster,
        forceTLS: true,
      });
      pusherInstance.connection.bind("error", (err: any) => {
        console.error("Pusher connection error:", err);
      });
      console.log("Pusher initialized successfully");
    } catch (err) {
      console.error("Failed to initialize Pusher:", err);
      return null;
    }
  }
  return pusherInstance;
};
