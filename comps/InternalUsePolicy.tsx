"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/Form.module.css";

export default function InternalUsePolicy() {
  const pageVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.3 } },
  };

  return (
    <div className={styles.container}>
      <AnimatePresence>
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={styles.policyContainer}
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
          <h2 className={styles.title}>Internal Use Policy</h2>
          <div className={styles.policyContent}>
            <p className={styles.text}>
              Welcome to MsgApp, a secure messaging platform designed for
              internal communication within our organization. This Internal Use
              Policy outlines the guidelines and expectations for using MsgApp
              to ensure a safe, productive, and compliant environment.
            </p>

            <h3 className={styles.subtitle}>1. Purpose</h3>
            <p className={styles.text}>
              MsgApp is provided to facilitate efficient and secure
              communication among employees, teams, and departments. It is
              intended for work-related purposes, including collaboration,
              project updates, and internal announcements.
            </p>

            <h3 className={styles.subtitle}>2. Acceptable Use</h3>
            <ul className={styles.list}>
              <li>
                Use MsgApp for professional communication related to your job
                responsibilities.
              </li>
              <li>Share information in a respectful and courteous manner.</li>
              <li>
                Ensure all shared content complies with organizational policies
                and applicable laws.
              </li>
            </ul>

            <h3 className={styles.subtitle}>3. Prohibited Activities</h3>
            <ul className={styles.list}>
              <li>
                Sharing confidential or sensitive information outside authorized
                channels.
              </li>
              <li>
                Engaging in harassment, discrimination, or inappropriate
                behavior.
              </li>
              <li>
                Using MsgApp for personal communications unrelated to work.
              </li>
              <li>
                Transmitting malicious content, such as viruses or phishing
                links.
              </li>
            </ul>

            <h3 className={styles.subtitle}>4. Security and Privacy</h3>
            <p className={styles.text}>
              All communications on MsgApp are monitored to ensure compliance
              with organizational policies. Users are responsible for:
            </p>
            <ul className={styles.list}>
              <li>
                Keeping login credentials secure and not sharing them with
                others.
              </li>
              <li>
                Reporting any suspicious activity or unauthorized access
                immediately.
              </li>
              <li>
                Logging out of MsgApp when using shared or public devices.
              </li>
            </ul>
            <p className={styles.text}>
              MsgApp employs encryption and other security measures to protect
              your data, but users must adhere to best practices to maintain
              security.
            </p>

            <h3 className={styles.subtitle}>5. Data Retention</h3>
            <p className={styles.text}>
              Messages and data shared on MsgApp may be retained for
              record-keeping, compliance, or audit purposes, as per
              organizational and legal requirements. Deleted messages may still
              be stored in backups.
            </p>

            <h3 className={styles.subtitle}>6. Compliance and Enforcement</h3>
            <p className={styles.text}>
              Failure to comply with this policy may result in disciplinary
              action, including suspension of MsgApp access or termination of
              employment. The organization reserves the right to investigate any
              misuse of the platform.
            </p>

            <h3 className={styles.subtitle}>7. Contact</h3>
            <p className={styles.text}>
              For questions about this policy or to report violations, contact
              the IT department at{" "}
              <a href="mailto:support@msgapp.com" aria-label="Contact Support">
                support@msgapp.com
              </a>
              .
            </p>
          </div>
          <div className={styles.button_row}>
            <Link href="/auth" passHref>
              <button
                className={`${styles.button} ${styles.primary_button}`}
                aria-label="Back to Sign In"
              >
                Back to Sign In
              </button>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
