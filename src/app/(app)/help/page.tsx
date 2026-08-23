import { HelpGuide } from "@/components/help/help-guide";
import { getOrganization } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Aide" };

export default async function HelpPage() {
  const org = await getOrganization();

  return (
    <div>
      <PageHeader
        title="Aide"
        description="L'essentiel pour travailler au quotidien, sans jargon."
      />
      <HelpGuide cashEnabled={org.cash_enabled} />
    </div>
  );
}
