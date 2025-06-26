// comps/AuthPage.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
// import { useGoogleAuth } from "../lib/useGoogleAuth";
import styles from "../styles/Form.module.css";

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountName: string;
}

export interface Alert {
  type: "error" | "success" | "loading" | "";
  message: string;
  show: boolean;
}

export interface Props {
  onSubmit: (
    formData: FormData,
    isSignup: boolean,
    isReset?: boolean,
    isForgot?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  onLogout: () => Promise<{ success: boolean; message: string }>;
}

export default function AuthPage({ onSubmit, onLogout }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountName: "",
  });
  const [alert, setAlert] = useState<Alert>({
    type: "",
    message: "",
    show: false,
  });
  // const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  // const { handleGoogleLogin, handleGoogleLogout } = useGoogleAuth();

  useEffect(() => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      accountName: "",
    });
    setAlert({ type: "", message: "", show: false });
    if (router.query.token) setIsReset(true);
  }, [router.query.token]);

  useEffect(() => {
    if (!isSignup) {
      setFormData((prev) => ({
        ...prev,
        firstName: "",
        lastName: "",
        accountName: "",
      }));
    }
    setAlert({ type: "", message: "", show: false });
    emailInputRef.current?.focus();
  }, [isSignup]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert({ type: "loading", message: "Processing...", show: true });
    try {
      const result = await onSubmit(formData, isSignup, isReset, isForgot);
      if (result.success) {
        setAlert({
          type: "success",
          message: result.message || "Signed in successfully!",
          show: true,
        });
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          accountName: "",
        });
        setTimeout(() => router.push("/chats"), 1000);
      }
    } catch (error: any) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message || error.message || "Operation failed.",
        show: true,
      });
    } finally {
      setTimeout(() => setAlert({ type: "", message: "", show: false }), 3000);
    }
  };

  // const handleSignOut = async () => {
  //   setAlert({ type: "loading", message: "Signing out...", show: true });
  //   try {
  //     const result = await onLogout();
  //     // await handleGoogleLogout();
  //     setAlert({
  //       type: "success",
  //       message: result.message || "Signed out successfully!",
  //       show: true,
  //     });
  //     setTimeout(() => router.push("/"), 1000);
  //   } catch (error: any) {
  //     setAlert({
  //       type: "error",
  //       message:
  //         error.response?.data?.message || error.message || "Sign-out failed.",
  //       show: true,
  //     });
  //   } finally {
  //     setTimeout(() => setAlert({ type: "", message: "", show: false }), 3000);
  //   }
  // };

  // const handleGoogleSignIn = async () => {
  //   setIsGoogleLoading(true);
  //   try {
  //     await handleGoogleLogin(
  //       (data) => {
  //         setAlert({
  //           type: "success",
  //           message: "Google Sign-In successful!",
  //           show: true,
  //         });
  //         setTimeout(() => router.push("/chats"), 1000);
  //       },
  //       (error: any) => {
  //         throw new Error(
  //           error.response?.data?.message || "Google Sign-In failed"
  //         );
  //       }
  //     );
  //   } catch (error: any) {
  //     setAlert({
  //       type: "error",
  //       message: error.message || "Google Sign-In failed.",
  //       show: true,
  //     });
  //   } finally {
  //     setIsGoogleLoading(false);
  //     setTimeout(() => setAlert({ type: "", message: "", show: false }), 3000);
  //   }
  // };

  const formVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.4 },
    }),
  };

  const alertVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const customDirection = isSignup || isForgot || isReset ? 1 : -1;

  return (
    <div className={styles.container}>
      {
        /* <AnimatePresence>
        {alert.show && (
          <motion.div
            className={`${styles.alert} ${styles[alert.type]}`}
            variants={alertVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            role="alert"
            aria-live="assertive"
          >
            {alert.type === "loading" && (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            <span>{alert.message}</span>
            {alert.type !== "loading" && (
              <button
                className={styles.alertClose}
                onClick={() => setAlert({ type: "", message: "", show: false })}
                aria-label="Close alert"
              >
                ×
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence> 
      */ <AnimatePresence>
          {alert.show && (
            <motion.div
              className={`${styles.alert} ${styles[alert.type]}`}
              variants={alertVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="alert"
              aria-live="assertive"
            >
              {alert.type === "loading" && (
                <span className={styles.spinner} aria-hidden="true" />
              )}
              <span>{alert.message}</span>
              {alert.type !== "loading" && alert.type !== "success" && (
                <button
                  className={styles.alertClose}
                  onClick={() =>
                    setAlert({ type: "", message: "", show: false })
                  }
                  aria-label="Close alert"
                >
                  ×
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      }
      <AnimatePresence mode="wait" custom={customDirection}>
        <motion.form
          key={
            isSignup
              ? "signup"
              : isForgot
              ? "forgot"
              : isReset
              ? "reset"
              : "login"
          }
          custom={customDirection}
          variants={formVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`${styles.form} ${
            isSignup ? styles.formSignup : styles.formSignin
          }`}
          onSubmit={handleSubmit}
        >
          <div className={styles.logo}>
            <h1 className={styles.logoHeader}>
              <Link href="/" aria-label="MsgApp Home">
                <Image
                  src="/cover-1.png"
                  alt="MsgApp Logo"
                  width={45}
                  height={35}
                  priority
                />
              </Link>
              MsgApp
            </h1>
          </div>
          <p className={styles.title}>
            {isSignup
              ? "Sign Up"
              : isForgot
              ? "Forgot Password"
              : isReset
              ? "Reset Password"
              : "Sign In"}
          </p>
          {isSignup && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                className={styles.input}
                value={formData.firstName}
                onChange={handleChange}
                required
                aria-label="First Name"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                className={styles.input}
                value={formData.lastName}
                onChange={handleChange}
                required
                aria-label="Last Name"
              />
              <input
                type="text"
                name="accountName"
                placeholder="Account Name"
                className={styles.input}
                value={formData.accountName}
                onChange={handleChange}
                required
                aria-label="Account Name"
              />
            </>
          )}
          {(isForgot || !isReset) && (
            <input
              type="email"
              name="email"
              placeholder="Email"
              className={styles.input}
              value={formData.email}
              onChange={handleChange}
              required
              ref={emailInputRef}
              aria-label="Email Address"
            />
          )}
          {!isForgot && (
            <input
              type="password"
              name="password"
              placeholder="Password"
              className={styles.input}
              value={formData.password}
              onChange={handleChange}
              required
              aria-label="Password"
            />
          )}
          {/* <button
            type="button"
            onClick={handleGoogleSignIn}
            className={styles.google_button}
            disabled={isGoogleLoading}
            aria-label="Sign in with Google"
          >
            Sign in with Google
          </button> */}
          <p className={styles.text}>
            {isSignup ? (
              <>
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignup(false);
                    setIsForgot(false);
                    setIsReset(false);
                  }}
                  aria-label="Switch to Sign In"
                >
                  Sign In
                </a>
              </>
            ) : isForgot ? (
              <>
                Back to{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgot(false);
                    setIsReset(false);
                  }}
                  aria-label="Back to Sign In"
                >
                  Sign In
                </a>
              </>
            ) : isReset ? (
              <>
                Back to{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsReset(false);
                    setIsForgot(false);
                  }}
                  aria-label="Back to Sign In"
                >
                  Sign In
                </a>
              </>
            ) : (
              <>
                No account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignup(true);
                    setIsForgot(false);
                    setIsReset(false);
                  }}
                  aria-label="Switch to Sign Up"
                >
                  Create one!
                </a>{" "}
                |{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgot(true);
                    setIsReset(false);
                  }}
                  aria-label="Forgot Password"
                >
                  Forgot Password?
                </a>
              </>
            )}
          </p>
          {!isSignup && !isForgot && !isReset && (
            <p className={styles.text}>
              <Link href="/policy" aria-label="Internal Use Policy">
                Internal Use Policy
              </Link>
            </p>
          )}
          <div className={styles.button_row}>
            <button
              className={`${styles.button} ${styles.primary_button}`}
              type="submit"
              disabled={alert.type === "loading"}
              aria-label={
                isSignup
                  ? "Sign Up"
                  : isForgot
                  ? "Send Reset Link"
                  : isReset
                  ? "Reset Password"
                  : "Sign In"
              }
            >
              {isSignup
                ? "Sign Up"
                : isForgot
                ? "Send Reset Link"
                : isReset
                ? "Reset Password"
                : "Sign In"}
            </button>
            {/* <button
              className={`${styles.button} ${styles.primary_button}`}
              type="button"
              onClick={handleSignOut}
              disabled={alert.type === "loading"}
              aria-label="Sign Out"
            >
              Sign Out
            </button> */}
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
