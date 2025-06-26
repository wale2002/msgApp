// appfolder/pages/profile.tsx
import { useState, useEffect } from "react";
import { getMe, User, ExtendedUser } from "../lib/api";
import { CldImage } from "next-cloudinary";
import TopBar from "../comps/TopBar";
import BottomBar from "../comps/BottomBar";
import styles from "../styles/ProfilePage.module.css"; // Import CSS module

export default function Profile() {
  const [user, setUser] = useState<ExtendedUser | null>(null);

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

  return (
    <div className={styles.profilePage}>
      <TopBar />
      <div className={styles.profileContainer}>
        {user ? (
          <>
            {user.profilePicture ? (
              <CldImage
                src={user.profilePicture}
                width={120}
                height={120}
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
            <h2 className={styles.name}>{user.name}</h2>
            <div className={styles.profileDetails}>
              {/* Placeholder for additional details */}
              <p>Niche: {user.accountName || "Not provided"}</p>
              <p>Email: {user.email || "Not provided"}</p>
              <p>Department: {"thefifthlab"}</p>

              {/* Add more fields like bio, phone, etc. */}
            </div>
          </>
        ) : (
          <p className={styles.loading}>Loading...</p>
        )}
      </div>
      <BottomBar />
    </div>
  );
}
