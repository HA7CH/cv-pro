"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Island() {
  const [voice, setVoice] = useState("");

  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const v = target?.getAttribute?.("data-voice");
      if (v) setVoice(v);
    };
    const onOut = () => setVoice("");

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <AnimatePresence>
      {voice && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-40 hidden bg-zinc-900/85 p-4 text-center text-white backdrop-blur-sm md:block"
        >
          {voice}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
