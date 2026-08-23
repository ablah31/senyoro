import Link from "next/link";
import { ChevronDown, CircleHelp } from "lucide-react";
import { getHelpSteps, getHelpTopics } from "@/lib/help";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HelpGuide({ cashEnabled }: { cashEnabled: boolean }) {
  const steps = getHelpSteps(cashEnabled);
  const topics = getHelpTopics(cashEnabled);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>La journée type</CardTitle>
          <CardDescription>Du premier client jusqu&apos;au soir.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col">
            {steps.map((step, index) => {
              const last = index === steps.length - 1;
              return (
                <li key={step.href + step.title} className="grid grid-cols-[2rem_1fr] gap-x-4">
                  <div className="flex flex-col items-center">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-sm font-medium tabular-nums text-primary-foreground">
                      {index + 1}
                    </span>
                    {last ? null : <span className="w-px flex-1 bg-border" aria-hidden />}
                  </div>
                  <div className={last ? "pb-1" : "pb-6"}>
                    <p className="pt-1 font-medium">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                    <Button
                      variant="outline"
                      className="mt-3 h-11"
                      nativeButton={false}
                      render={<Link href={step.href} />}
                    >
                      {step.action}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CircleHelp className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold">Une question précise</h2>
        </div>
        <p className="text-sm text-muted-foreground">Ouvrez une question pour lire la réponse.</p>
        <div className="flex flex-col gap-2">
          {topics.map((topic) => (
            <details
              key={topic.id}
              id={topic.id}
              className="group rounded-xl bg-card ring-1 ring-foreground/10 open:ring-foreground/15"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium marker:hidden transition-colors hover:bg-muted/70 group-open:rounded-b-none [&::-webkit-details-marker]:hidden focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                {topic.question}
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <div className="flex flex-col gap-3 px-4 pb-4">
                <ol className="flex flex-col gap-2">
                  {topic.points.map((point, index) => (
                    <li key={point} className="grid grid-cols-[1.25rem_1fr] gap-2 text-sm text-muted-foreground">
                      <span className="font-mono text-xs tabular-nums text-foreground/40">{index + 1}</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ol>
                {topic.href && topic.action ? (
                  <Button
                    variant="outline"
                    className="h-11 w-fit"
                    nativeButton={false}
                    render={<Link href={topic.href} />}
                  >
                    {topic.action}
                  </Button>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Les montants sont en francs guinéens (GNF). Le bénéfice est une estimation interne, pas un
        bilan comptable.
      </p>
    </div>
  );
}
