"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import Calendar from "../comps/Calendar";
import styles from "../styles/Chat.module.css";
import {
  FaComment,
  FaUser,
  FaPlus,
  FaBell,
  FaUserFriends,
  FaCalendar,
} from "react-icons/fa";
import { Logout } from "@mui/icons-material";

interface Task {
  id: string;
  title: string;
  dateTime: string;
  description?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize tasks and isClient on client side after hydration
  useEffect(() => {
    setIsClient(true);
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Sync tasks with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTasks = localStorage.getItem("tasks");
      setTasks(savedTasks ? JSON.parse(savedTasks) : []);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleToggleSidebar = (route: "chats" | "contacts" | "calendar") => {
    router.push(
      route === "chats"
        ? "/chats"
        : route === "contacts"
        ? "/contacts"
        : "/calendar",
      undefined,
      { shallow: true }
    );
  };

  const handleProfileClick = () => {
    router.push("/profile", undefined, { shallow: true });
  };

  const handleNewChat = () => {
    router.push("/chats", undefined, { shallow: true });
  };

  const handleNotificationsClick = () => {
    setShowTasksModal(true);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    router.push("/auth");
  };

  const handleCloseModal = () => {
    setShowTasksModal(false);
  };

  return (
    <div className={styles.chatPage}>
      <div className={styles.content}>
        <aside className={styles.iconSidebar}>
          <button
            onClick={() => handleToggleSidebar("chats")}
            className={`${styles.iconButton} ${
              router.pathname === "/chats" ? styles.active : ""
            }`}
            aria-label="Switch to Chats"
          >
            <FaComment size={24} />
          </button>
          <button
            onClick={handleProfileClick}
            className={styles.iconButton}
            aria-label="View Profile"
          >
            <FaUser size={24} />
          </button>
          <button
            onClick={handleNewChat}
            className={styles.iconButton}
            aria-label="Start New Chat"
          >
            <FaPlus size={24} />
          </button>
          <button
            onClick={handleNotificationsClick}
            className={styles.iconButton}
            aria-label="View Notifications"
          >
            <FaBell size={24} />
            {isClient && tasks.length > 0 && (
              <span className={styles.notificationBadge}>{tasks.length}</span>
            )}
          </button>
          <button
            onClick={() => handleToggleSidebar("calendar")}
            className={`${styles.iconButton} ${
              router.pathname === "/calendar" ? styles.active : ""
            }`}
            aria-label="View Calendar"
          >
            <FaCalendar size={24} />
          </button>
          <button
            onClick={handleLogout}
            className={styles.iconButton}
            aria-label="Logout"
          >
            <Logout />
          </button>
          <button
            onClick={() => handleToggleSidebar("contacts")}
            className={`${styles.iconButton} ${
              router.pathname === "/contacts" ? styles.active : ""
            }`}
            aria-label="Switch to Contacts"
          >
            <FaUserFriends size={24} />
          </button>
        </aside>
        <main className={styles.mainContent}>
          <Calendar />
        </main>
        {isClient && showTasksModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Pending Tasks</h2>
              {tasks.length === 0 ? (
                <p>No tasks scheduled.</p>
              ) : (
                <ul>
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <strong>{task.title}</strong> -{" "}
                      {format(new Date(task.dateTime), "MMMM d, yyyy h:mm a")}
                      {task.description && <p>{task.description}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={handleCloseModal}
                className={styles.modalCloseButton}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
