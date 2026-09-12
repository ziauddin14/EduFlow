import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getAdmissionById } from "@/lib/services/admission.service";
import { listClassesWithCounts } from "@/lib/services/class.service";
import { serialize } from "@/lib/serialize";
import { AdmissionDetailView } from "@/components/admissions/admission-detail-view";

// Force dynamic rendering to prevent build-time database connection issues
export const dynamic = 'force-dynamic';

export default async function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let data;
  try {
    data = await getAdmissionById(id);
  } catch {
    notFound();
  }

  const classes = await listClassesWithCounts();

  return (
    <div>
      <PageHeader title={data.admission.applicantName} description="Admission details and status." />
      <AdmissionDetailView data={serialize(data)} classes={serialize(classes)} />
    </div>
  );
}
