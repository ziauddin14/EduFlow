"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Dynamically import SessionProvider to prevent build-time evaluation issues
const SessionProvider = dynamic(
  () => import("next-auth/react").then((mod) => mod.SessionProvider),
  { ssr: false }
);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
