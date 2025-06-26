// pages/index.tsx
import { motion, Variants } from "framer-motion";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/Home.module.css";

// Explicitly typed as Variants to avoid TS error
const containerVariants: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.2,
      when: "beforeChildren", // casting lets this pass
    },
  },
};

const childVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const Home = () => {
  return (
    <>
      <Head>
        <title>MsgApp - Your Messaging Hub</title>
        <meta
          name="description"
          content="Welcome to MsgApp, the ultimate platform for seamless messaging."
        />
        <meta
          name="keywords"
          content="messaging app, chat, communication, MsgApp"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <motion.main
        className={styles.container}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <div className={styles.hero}>
          <motion.div className={styles.content} variants={childVariants}>
            <motion.h1 className={styles.title} variants={childVariants}>
              Welcome to MsgApp
            </motion.h1>
            <motion.p className={styles.subtitle} variants={childVariants}>
              Connect instantly. Chat seamlessly. Your messaging hub awaits.
            </motion.p>
            <motion.div className={styles.cta} variants={childVariants}>
              <Link href="/auth">
                <button className={styles.button}>Get Started</button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div className={styles.logo} variants={childVariants}>
            <Image
              src="/cover-1.png"
              alt="MsgApp logo"
              width={400}
              height={350}
              priority
              className={styles.logoImage}
            />
          </motion.div>
        </div>
      </motion.main>
    </>
  );
};

export default Home;
