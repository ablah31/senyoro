"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

const chartConfig = {
  value: { label: "Valeur", color: "var(--chart-1)" },
} satisfies ChartConfig;

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function LineMetricChart({
  title,
  data,
}: {
  title: string;
  data: { bucket: string; value: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[16/9] min-h-[180px] w-full">
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="bucket" tickFormatter={(v) => String(v).slice(8)} />
            <YAxis tickFormatter={(v) => formatNumber(v)} width={72} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="value" type="monotone" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function BarMetricChart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[16/9] min-h-[180px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={90} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--chart-1)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function PieMetricChart({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
