import withAuth from "next-auth/middleware";

export default withAuth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/teachers/:path*",
    "/admissions/:path*",
    "/attendance/:path*",
    "/fees/:path*",
    "/academics/:path*",
    "/exams/:path*",
    "/notices/:path*",
    "/reports/:path*",
    "/ai-assistant/:path*",
  ],
};
