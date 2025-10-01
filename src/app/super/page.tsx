"use client";

import { useEffect, useState } from "react";
import type { Tenant } from "@/lib/types";

export default function SuperPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    fetch("/api/tenants").then((r) => r.json()).then((d) => setTenants(d.tenants));
  }, []);

  async function impersonate(id: string) {
    await fetch("/api/tenants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: id }),
    });
    location.assign("/admin");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Superuser Paneli</h1>
      <div className="grid gap-3">
        {tenants.map((t) => (
          <div key={t.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-neutral-500">id: {t.id}</div>
            </div>
            <button className="px-3 py-1.5 rounded border" onClick={() => impersonate(t.id)}>
              Impersonate → Admin
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


