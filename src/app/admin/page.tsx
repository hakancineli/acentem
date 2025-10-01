"use client";

import { useEffect, useState } from "react";
import type { Tenant, ModuleKey } from "@/lib/types";

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((d) => setTenants(d.tenants))
      .finally(() => setLoading(false));
  }, []);

  async function switchTenant(id: string) {
    await fetch("/api/tenants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: id }),
    });
    location.reload();
  }

  async function toggle(tenantId: string, key: ModuleKey, enabled: boolean) {
    await fetch("/api/modules/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, key, enabled }),
    });
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, modules: { ...t.modules, [key]: enabled } } : t))
    );
  }

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin — Tenant ve Modüller</h1>
      <div className="space-y-4">
        {tenants.map((t) => (
          <div key={t.id} className="border rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.name}</div>
              <button className="px-3 py-1.5 rounded border" onClick={() => switchTenant(t.id)}>
                Bu tenant ile çalış
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.entries(t.modules).map(([key, val]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => toggle(t.id, key as ModuleKey, e.target.checked)}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


