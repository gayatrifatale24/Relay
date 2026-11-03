"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar/sidebar";

interface SidebarState {
  desktopOpen: boolean;
  toggleDesktop: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const context = use(SidebarContext);
  if (!context) throw new Error("useSidebar must be used inside ChatShell");
  return context;
}

const SIDEBAR_WIDTH = 272;
const ease = [0.2, 0, 0, 1] as const;

export function ChatShell({ children }: { children: React.ReactNode }) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const state = useMemo<SidebarState>(
    () => ({
      desktopOpen,
      toggleDesktop: () => setDesktopOpen((open) => !open),
      openMobile: () => setMobileOpen(true),
      closeMobile,
    }),
    [desktopOpen, closeMobile],
  );

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  return (
    <SidebarContext value={state}>
      <div className="flex h-dvh overflow-hidden bg-canvas">
        <motion.aside
          initial={false}
          animate={{ width: desktopOpen ? SIDEBAR_WIDTH : 0 }}
          transition={{ duration: 0.22, ease }}
          className="hidden shrink-0 overflow-hidden border-line lg:block"
          style={{ borderRightWidth: desktopOpen ? 1 : 0 }}
          aria-label="Conversations"
          inert={!desktopOpen}
        >
          <motion.div
            initial={false}
            animate={{ opacity: desktopOpen ? 1 : 0, x: desktopOpen ? 0 : -12 }}
            transition={{ duration: 0.18, ease }}
            className="h-full"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <Sidebar onClose={state.toggleDesktop} />
          </motion.div>
        </motion.aside>

        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <motion.div
                className="absolute inset-0 bg-black/30 dark:bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeMobile}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Conversations"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease }}
                className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] border-r border-line bg-canvas shadow-pop"
              >
                <Sidebar onClose={closeMobile} onNavigate={closeMobile} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <main className="flex min-w-0 flex-1 flex-col bg-surface">{children}</main>
      </div>
    </SidebarContext>
  );
}
