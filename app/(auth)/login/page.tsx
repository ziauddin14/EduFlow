import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { GraduationCap } from "lucide-react";
import { authOptions } from "@/lib/auth/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">EduFlow</h1>
          <p className="text-sm text-muted-foreground">Sign in to your school management console</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-background p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Demo accounts</p>
          <ul className="space-y-1">
            <li>Admin — admin@eduflow.demo</li>
            <li>Teacher — teacher@eduflow.demo</li>
            <li>Staff — staff@eduflow.demo</li>
          </ul>
          <p className="mt-2">Password: see README (seeded by the demo data script)</p>
        </div>
      </div>
    </div>
  );
}
