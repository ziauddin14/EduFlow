import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { PageHeader } from "@/components/shared/page-header";
import { listNotices } from "@/lib/services/notice.service";
import { serialize } from "@/lib/serialize";
import { NoticesPageClient } from "@/components/notices/notices-page-client";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role;

  const notices = await listNotices({ viewerRole: role });

  return (
    <div>
      <PageHeader title="Notices" description="School announcements and notices." />
      <NoticesPageClient initialNotices={serialize(notices)} />
    </div>
  );
}
