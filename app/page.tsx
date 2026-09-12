import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  redirect(session?.user ? "/dashboard" : "/login");
}
