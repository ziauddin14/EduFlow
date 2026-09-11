import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduFlow | School Management System",
  description: "EduFlow — a modern school management system by Softwaremine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthSessionProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
