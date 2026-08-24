import { HelpGuide } from "@/components/help/help-guide";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Aide" };

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="Aide"
        description="L'essentiel pour travailler au quotidien, sans jargon."
      />
      <HelpGuide />
    </div>
  );
}
