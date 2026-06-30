import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';

const SPLASH_MS = 1200;
const SESSION_KEY = 'ascendx_splash_seen';

interface BrandSplashProps {
  children: React.ReactNode;
}

export function BrandSplash({ children }: BrandSplashProps) {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      setVisible(false);
    }, SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  return (
    <>
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0f]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <motion.div
              className="relative flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <motion.div
                className="brand-glow rounded-2xl"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.4 }}>
                <BrandLogo size="lg" />
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {children}
    </>
  );
}
