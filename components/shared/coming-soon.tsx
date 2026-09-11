import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export function ComingSoon({
  title,
  description,
  note,
}: {
  title: string;
  description: string;
  note: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader>
          <CardTitle>Under construction</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{note}</CardContent>
      </Card>
    </div>
  );
}
