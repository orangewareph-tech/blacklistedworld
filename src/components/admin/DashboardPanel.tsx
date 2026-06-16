import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type WeekRow = { week: string; submitted: number; approved: number; rejected: number; high_risk: number };

const RISK_COLORS = { low: "#34d399", medium: "#fbbf24", high: "#f87171" } as const;

export function DashboardPanel() {
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [byCountry, setByCountry] = useState<{ name: string; value: number }[]>([]);
  const [byCategory, setByCategory] = useState<{ name: string; value: number }[]>([]);
  const [byRisk, setByRisk] = useState<{ name: string; value: number }[]>([]);
  const [sla, setSla] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: w } = await supabase
        .from("v_admin_weekly_stats")
        .select("*")
        .order("week", { ascending: true })
        .limit(26);
      setWeeks(((w ?? []) as WeekRow[]).map((r) => ({
        ...r,
        week: new Date(r.week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      })));

      const { data: all } = await supabase
        .from("reports")
        .select("country,category,risk,status,created_at,reviewed_at")
        .limit(2000);
      const rows = all ?? [];

      const tally = (key: "country" | "category" | "risk") => {
        const map = new Map<string, number>();
        rows.forEach((r) => {
          const v = (r as Record<string, string | null>)[key] ?? "—";
          map.set(v, (map.get(v) ?? 0) + 1);
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      };

      setByCountry(tally("country").slice(0, 8));
      setByCategory(tally("category").slice(0, 8));
      setByRisk(tally("risk"));

      const reviewed = rows.filter((r) => r.reviewed_at && r.created_at);
      if (reviewed.length > 0) {
        const totalH = reviewed.reduce((s, r) => s + (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()), 0) / 36e5;
        setSla(totalH / reviewed.length);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Avg approval SLA" value={sla === null ? "—" : `${sla.toFixed(1)} h`} />
        <Stat label="Weeks tracked" value={String(weeks.length)} />
        <Stat label="Distinct countries" value={String(byCountry.length)} />
      </div>

      <div className="bl-card p-4">
        <h3 className="text-sm font-bold mb-3">Reports per week</h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="week" stroke="#888" tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="submitted" stroke="#60a5fa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="approved" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rejected" stroke="#f87171" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bl-card p-4">
          <h3 className="text-sm font-bold mb-3">Top countries</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={byCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" stroke="#888" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#888" width={110} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Bar dataKey="value" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bl-card p-4">
          <h3 className="text-sm font-bold mb-3">Top categories</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis type="number" stroke="#888" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#888" width={130} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Bar dataKey="value" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bl-card p-4">
        <h3 className="text-sm font-bold mb-3">Risk breakdown</h3>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byRisk} dataKey="value" nameKey="name" outerRadius={90} label={{ fontSize: 11 }}>
                {byRisk.map((r) => (
                  <Cell key={r.name} fill={RISK_COLORS[r.name as keyof typeof RISK_COLORS] ?? "#888"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bl-card p-4">
      <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
