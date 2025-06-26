"use client";
import { useState, useEffect } from "react";
import {
  getUsers,
  getMe,
  createChat,
  ExtendedUser,
  getChats,
} from "../lib/api";
import { CldImage } from "next-cloudinary";
import Loader from "./Loader";
import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { useRouter } from "next/router"; // Pages Router
import { emitNewChat } from "../lib/events";
import toast from "react-hot-toast";
import styles from "../styles/Contacts.module.css";

const Contacts = () => {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ExtendedUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<ExtendedUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isGroup = selectedContacts.length > 1;
  const router = useRouter();

  const getContactsList = async (retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const userRes = await getMe();
        console.log("getMe Response:", JSON.stringify(userRes.data, null, 2));
        if (!userRes.data.success && userRes.data.success !== undefined) {
          throw new Error(
            userRes.data.message || "Failed to fetch current user"
          );
        }
        if (!userRes.data.data) {
          throw new Error("No user data in response");
        }
        const currentUserData = userRes.data.data as ExtendedUser;
        console.log("Current User:", currentUserData);

        const res = await getUsers();
        console.log("e show?", JSON.stringify(res, null, 2));
        console.log("getUsers Response:", JSON.stringify(res.data, null, 2));
        // Allow success: undefined if status is "success" and data exists
        if (
          res.data.status !== "success" ||
          (!res.data.success && res.data.success !== undefined)
        ) {
          console.error("getUsers validation failed:", {
            status: res.data.status,
            success: res.data.success,
            message: res.data.message,
            data: res.data.data,
          });
          throw new Error(res.data.message || "Failed to load users");
        }
        if (!res.data.data || !res.data.data.users) {
          console.error(
            "No users data in response:",
            JSON.stringify(res.data, null, 2)
          );
          throw new Error(res.data.message || "No users found in response");
        }
        const filteredContacts = res.data.data.users
          .filter(
            (contact: ExtendedUser) =>
              contact.id !== currentUserData.id && contact.id
          )
          .map((contact: ExtendedUser) => ({
            id: contact.id,
            accountName: contact.accountName,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            profilePicture: contact.profilePicture,
            name:
              contact.accountName ||
              `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
              "Unknown",
          }));
        console.log("Filtered Contacts:", filteredContacts);
        if (filteredContacts.length === 0) {
          setError("No valid contacts found");
          toast.error("No valid contacts found");
          return;
        }
        setContacts(filteredContacts);
        setError(null);
        return; // Success, exit retry loop
      } catch (err: any) {
        console.error(`Attempt ${attempt} failed:`, {
          message: err.message,
          stack: err.stack,
          response: err.response?.data,
          status: err.response?.status,
        });
        if (attempt === retries) {
          const errorMessage =
            err.message === "Failed to load users" ||
            err.message === "Failed to fetch users"
              ? "Unable to load contacts. Please check your connection or try again later."
              : err.message || "An unexpected error occurred";
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          console.log(
            `Retrying getContactsList (${attempt + 1}/${retries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } finally {
        if (attempt === retries) {
          setLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    getContactsList();
  }, []);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.accountName?.toLowerCase().includes(search.toLowerCase()) ||
      contact.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      contact.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (contact: ExtendedUser) => {
    setSelectedContacts((prev) =>
      prev.includes(contact)
        ? prev.filter((item) => item !== contact)
        : [...prev, contact]
    );
  };

  const createNewChat = async () => {
    try {
      setError(null);
      setLoading(true);
      const recipients = selectedContacts
        .map((c: ExtendedUser) => c.id)
        .filter((id) => id);
      if (!recipients.length) {
        throw new Error("At least one valid recipient is required");
      }

      const userRes = await getMe();
      if (!userRes.data.success || !userRes.data.data) {
        throw new Error(userRes.data.message || "Failed to fetch current user");
      }
      const currentUser = userRes.data.data;
      const chatsRes = await getChats();
      if (!chatsRes.data.success) {
        throw new Error(chatsRes.data.message || "Failed to fetch chats");
      }
      const chats = chatsRes.data.data || [];

      if (!isGroup && recipients.length === 1) {
        const existingChat = chats.find((chat) => {
          const memberIds = chat.members.map((m) => m.userId).sort();
          const expectedMembers = [currentUser.id, recipients[0]].sort();
          return (
            !chat.isGroupChat &&
            memberIds.length === expectedMembers.length &&
            memberIds.every((id, index) => id === expectedMembers[index])
          );
        });
        if (existingChat) {
          console.log("Existing chat found, navigating to:", existingChat.id);
          router.push(`/chats/${existingChat.id}`);
          return;
        }
      }

      console.log("Creating chat with:", {
        recipients,
        isGroupChat: isGroup,
        groupName,
      });
      const res = await createChat({
        recipients,
        isGroupChat: isGroup,
        groupName: isGroup ? groupName : undefined,
      });
      console.log(
        "createNewChat full response:",
        JSON.stringify(res.data, null, 2)
      );
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || "Failed to create chat");
      }

      const chatId = res.data.data.id;
      if (!chatId) {
        console.error(
          "Invalid chatId in response:",
          JSON.stringify(res.data, null, 2)
        );
        throw new Error("Invalid chat ID in response");
      }

      console.log("Navigating to chat ID:", chatId);
      emitNewChat(res.data.data);
      router.push(`/chats/${chatId}`);
    } catch (err: any) {
      console.error("Error creating chat:", {
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMessage =
        err.message === "Failed to create chat"
          ? "Unable to start chat. Please check your connection or try again later."
          : err.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createChatContainer}>
      {error && <div className={styles.error}>{error}</div>}
      {loading && <Loader />}
      <input
        placeholder="Search contact..."
        className={styles.inputSearch}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search contacts"
      />
      <div className={styles.contactBar}>
        <div className={styles.contactList}>
          <p className={styles.sectionTitle}>Select or Deselect</p>
          <div className={styles.contactWrapper}>
            {filteredContacts.map((user) => (
              <div
                key={user.id}
                className={styles.contact}
                onClick={() => handleSelect(user)}
                role="button"
                aria-label={`Select ${user.name}`}
              >
                {selectedContacts.includes(user) ? (
                  <CheckCircle sx={{ color: "#ff4d4f" }} />
                ) : (
                  <RadioButtonUnchecked sx={{ color: "#737373" }} />
                )}
                {user.profilePicture ? (
                  <CldImage
                    src={user.profilePicture}
                    width={40}
                    height={40}
                    alt={`${user.name}'s profile`}
                    className={styles.profilePhoto}
                    crop="fill"
                    gravity="face"
                    onError={(e) =>
                      (e.currentTarget.src = "/assets/person.png")
                    }
                  />
                ) : (
                  <img
                    src="/assets/person.png"
                    alt="profile"
                    className={styles.profilePhoto}
                  />
                )}
                <div className={styles.contactDetails}>
                  <p className={styles.contactField}>
                    <span className={styles.fieldLabel}>Account Name:</span>{" "}
                    {user.accountName || "N/A"}
                  </p>
                  <p className={styles.contactField}>
                    <span className={styles.fieldLabel}>First Name:</span>{" "}
                    {user.firstName || "N/A"}
                  </p>
                  {user.lastName && (
                    <p className={styles.contactField}>
                      <span className={styles.fieldLabel}>Last Name:</span>{" "}
                      {user.lastName}
                    </p>
                  )}
                  <p className={styles.contactField}>
                    <span className={styles.fieldLabel}>Email:</span>{" "}
                    {user.email || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.createChat}>
          {isGroup && (
            <>
              <div className={styles.groupNameSection}>
                <p className={styles.sectionTitle}>Group Chat Name</p>
                <input
                  placeholder="Enter group chat name..."
                  className={styles.inputGroupName}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  aria-label="Group chat name"
                />
              </div>
              <div className={styles.membersSection}>
                <p className={styles.sectionTitle}>Members</p>
                <div className={styles.selectedContacts}>
                  {selectedContacts.map((contact) => (
                    <p className={styles.selectedContact} key={contact.id}>
                      {contact.name}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
          <button
            className={styles.createButton}
            onClick={createNewChat}
            disabled={selectedContacts.length === 0}
            aria-label="Start new chat"
          >
            Find or Start a New Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
