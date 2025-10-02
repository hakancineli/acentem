"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ReservationRow = {
  id: string;
  module: string;
  title: string;
  subtitle?: string;
  dateFrom: Date | string;
  dateTo?: Date | string | null;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  href: string;
};

interface Props {
  rows: ReservationRow[];
  modules: string[]; // visible module labels
}

export default function AllReservationsList({ rows, modules }: Props) {
  const [q, setQ] = useState("");
  const [moduleKey, setModuleKey] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    let r = rows.slice();
    if (moduleKey !== "ALL") r = r.filter((x) => x.module === moduleKey);
    if (status !== "ALL") r = r.filter((x) => (x.status || "").toLowerCase() === status);
    if (q.trim()) {
      const qq = q.toLowerCase();
      r = r.filter((x) =>
        (x.title || "").toLowerCase().includes(qq) ||
        (x.subtitle || "").toLowerCase().includes(qq)
      );
    }
    if (from) {
      const df = new Date(from).getTime();
      r = r.filter((x) => new Date(x.dateFrom as any).getTime() >= df);
    }
    if (to) {
      const dt = new Date(to).getTime();
      r = r.filter((x) => new Date(x.dateFrom as any).getTime() <= dt);
    }
    return r;
  }, [rows, moduleKey, status, q, from, to]);

  const symbol = (c?: string | null) => (c === "USD" ? "$" : c === "EUR" ? "€" : "₺");

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="flex-1">
          <label className="block text-xs mb-1 text-slate-500">Ara</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Başlık veya özet"
            className="modern-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-slate-500">Modül</label>
          <select className="modern-input" value={moduleKey} onChange={(e) => setModuleKey(e.target.value)}>
            <option value="ALL">Tümü</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 text-slate-500">Durum</label>
          <select className="modern-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Tümü</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="waiting_for_driver">waiting_for_driver</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 text-slate-500">Başlangıç</label>
          <input type="date" className="modern-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1 text-slate-500">Bitiş</label>
          <input type="date" className="modern-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="divide-y">
        {filtered.map((r) => (
          <Link key={r.id} href={r.href} className="block py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.module} • {r.title}</div>
                <div className="text-xs text-slate-500">
                  {r.subtitle ? r.subtitle + " • " : ""}
                  {new Date(r.dateFrom as any).toLocaleDateString("tr-TR")}
                  {r.dateTo ? ` → ${new Date(r.dateTo as any).toLocaleDateString("tr-TR")}` : ""}
                </div>
              </div>
              <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                {r.amount != null && (
                  <div>
                    {symbol(r.currency)}{Number(r.amount).toLocaleString("tr-TR")}
                  </div>
                )}
                {r.status && <div className="text-xs text-slate-500">{r.status}</div>}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-slate-500 py-6 text-center">Kayıt bulunamadı.</div>
        )}
      </div>
    </div>
  );
}


