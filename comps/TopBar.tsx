// // export default TopBar;
// "use client";

// import { useState, useEffect } from "react";
// import { getMe, User, logout } from "../lib/api";
// import { usePathname, useRouter } from "next/navigation";
// import Link from "next/link";
// import { CldImage } from "next-cloudinary";
// import { Logout } from "@mui/icons-material";
// import styles from "../styles/TopBar.module.css";

// const TopBar = () => {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchUser = async () => {
//       if (pathname === "/auth") {
//         setLoading(false);
//         return; // Skip fetch on /auth
//       }
//       try {
//         setLoading(true);
//         setError(null);
//         const token = localStorage.getItem("authToken");
//         console.log("TopBar token:", token?.substring(0, 10) + "...");
//         if (!token) {
//           throw new Error("No auth token found");
//         }
//         const res = await getMe();
//         if (!res.data.success || !res.data.data) {
//           throw new Error(res.data.message || "Failed to fetch user");
//         }
//         setUser(res.data.data);
//       } catch (err: any) {
//         console.error("TopBar error:", err);
//         setError(err.message || "Failed to load user");
//         router.push("/auth");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchUser();
//   }, [pathname]); // Remove router dependency to avoid unnecessary fetches

//   const handleLogout = async () => {
//     try {
//       await logout();
//       setUser(null);
//       router.push("/auth");
//     } catch (err: any) {
//       console.error("Logout error:", err);
//       setError(err.message || "Failed to log out");
//       router.push("/auth");
//     }
//   };

//   if (loading) {
//     return null; // Consistent with current behavior
//   }

//   if (error && pathname !== "/auth") {
//     return (
//       <div className={styles.error}>
//         <p>{error}</p>
//         <Link href="/auth">Login</Link>
//       </div>
//     );
//   }

//   return (
//     <nav className={styles.topbar} aria-label="Main navigation">
//       <Link href="/chats" aria-label="Home">
//         <img src="/assets/logo.png" alt="App Logo" className={styles.logo} />
//       </Link>
//       <div className={styles.menu}>
//         {user ? (
//           <>
//             <Link
//               href="/chats"
//               className={`${styles.menuLink} ${
//                 pathname === "/chats" ? styles.menuLinkActive : ""
//               }`}
//               aria-current={pathname === "/chats" ? "page" : undefined}
//             >
//               Chats
//             </Link>
//             <Link
//               href="/contacts"
//               className={`${styles.menuLink} ${
//                 pathname === "/contacts" ? styles.menuLinkActive : ""
//               }`}
//               aria-current={pathname === "/contacts" ? "page" : undefined}
//             >
//               Contacts
//             </Link>
//             <button onClick={handleLogout} aria-label="Logout">
//               <Logout />
//             </button>
//             <Link
//               href="/profile"
//               aria-label={`Profile of ${user.name || "User"}`}
//             >
//               <div className={styles.userInfo}>
//                 {user.profilePicture ? (
//                   <CldImage
//                     src={user.profilePicture}
//                     width={36}
//                     height={36}
//                     alt={`${user.name || "User"}'s profile`}
//                     className={styles.profileImage}
//                     crop="fill"
//                     gravity="face"
//                     onError={(e) =>
//                       (e.currentTarget.src = "/assets/person.png")
//                     }
//                   />
//                 ) : (
//                   <img
//                     src="/assets/person.png"
//                     alt="Default profile"
//                     className={styles.profileImage}
//                   />
//                 )}
//                 <span className={styles.userName}>{user.name}</span>
//               </div>
//             </Link>
//           </>
//         ) : (
//           <Link
//             href="/auth"
//             className={`${styles.menuLink} ${
//               pathname === "/auth" ? styles.menuLinkActive : ""
//             }`}
//             aria-current={pathname === "/auth" ? "page" : undefined}
//           >
//             Login
//           </Link>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default TopBar;
//Old structure



//new structure

"use client";

import { useState, useEffect } from "react";
import { getMe, User, logout } from "../lib/api";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { Logout } from "@mui/icons-material";
import styles from "../styles/TopBar.module.css";

const TopBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (pathname === "/auth") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No auth token found");
        const res = await getMe();
        if (!res.data.success || !res.data.data) {
          throw new Error(res.data.message || "Failed to fetch user");
        }
        setUser(res.data.data);
      } catch (err: any) {
        console.error("TopBar error:", err);
        setError(err.message || "Failed to load user");
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      router.push("/auth");
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Failed to log out");
      router.push("/auth");
    }
  };

  if (loading) {
    return null;
  }

  if (error && pathname !== "/auth") {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <Link href="/auth">Login</Link>
      </div>
    );
  }

  return (
    <nav className={styles.topbar}>
      <Link href="/chats">
        <img src="/assets/logo.png" alt="App Logo" className={styles.logo} />
      </Link>
      <div className={styles.menu}>
        {user ? (
          <>
            <Link href="/chats" className={styles.menuLink}>
              Chats
            </Link>
            <Link href="/contacts" className={styles.menuLink}>
              Contacts
            </Link>
            <button onClick={handleLogout} aria-label="Logout">
              <Logout />
            </button>
            <Link href="/profile" aria-label="Profile of user">
              <div className={styles.userInfo}>
                {user.profilePicture ? (
                  <CldImage
                    src={user.profilePicture}
                    width={36}
                    height={36}
                    alt="User Profile"
                    className={styles.profileImage}
                    crop="fill"
                    gravity="face"
                    onError={(e) =>
                      (e.currentTarget.src = "/assets/person.png")
                    }
                  />
                ) : (
                  <img
                    src="/assets/person.png"
                    alt="Profile"
                    className={styles.profileImage}
                  />
                )}
                <span className={styles.userName}>{user.name}</span>
              </div>
            </Link>
          </>
        ) : (
          <Link href="/auth" className={styles.menuLink}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default TopBar;
