import { PageHeader } from "@/components/layout/page-header";
import { JournalEntryForm } from "@/components/journal-entries/journal-entry-form";
import { getCompanyContext } from "@/lib/company-context";
import { NoDatabase } from "@/components/empty-state";

export default async function NewJournalEntryPage() {
  let context;
  try {
    context = await getCompanyContext();
  } catch {
    return (
      <>
        <PageHeader title="Ny verifikation" />
        <NoDatabase />
      </>
    );
  }

  if (!context) {
    return (
      <>
        <PageHeader title="Ny verifikation" />
        <NoDatabase />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Ny verifikation"
        description="Skapa en ny verifikation manuellt"
      />
      <JournalEntryForm companyId={context.company.id} />
    </>
  );
}
