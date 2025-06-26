// // appfolder/comps/BottomBar.tsx
"use client";

import { Logout } from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, getMe, User } from "../lib/api";
import { CldImage } from "next-cloudinary";
import { useState, useEffect } from "react";
import styles from "../styles/BottomBar.module.css"; // Import CSS module

const BottomBar = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        if (res.data.success) {
          setUser(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className={styles.bottomBar}>
      <Link
        href="/chats"
        className={`${styles.link} ${
          pathname === "/chats" ? styles.activeLink : ""
        }`}
      >
        Chats
      </Link>
      <Link
        href="/contacts"
        className={`${styles.link} ${
          pathname === "/contacts" ? styles.activeLink : ""
        }`}
      >
        Contacts
      </Link>
      <Logout onClick={handleLogout} />
      <Link href="/profile">
        {user?.profilePicture ? (
          <CldImage
            src={user.profilePicture}
            width={40}
            height={40}
            alt="profile"
            className={styles.profilePhoto}
            crop="fill"
            gravity="face"
            onError={(e) => (e.currentTarget.src = "/assets/person.png")}
          />
        ) : (
          <img
            src="/assets/person.png"
            alt="profile"
            className={styles.profilePhoto}
          />
        )}
      </Link>
    </div>
  );
};

export default BottomBar;
