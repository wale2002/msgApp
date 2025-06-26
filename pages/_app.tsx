// pages/_app.tsx
import "../styles/globals.css";
import ToasterContext from "../comps/ToasterContext";
import { motion, AnimatePresence } from "framer-motion";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { loadAuthToken } from "../lib/api";

function MyApp({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    loadAuthToken(); // Load token on app start
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={router.route}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <ToasterContext />
        <Component {...pageProps} />
      </motion.div>
    </AnimatePresence>
  );
}

export default MyApp;
