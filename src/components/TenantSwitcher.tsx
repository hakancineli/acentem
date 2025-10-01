"use client";

import { useEffect, useState } from "react";

type TenantItem = { id: string; name: string };

export default function TenantSwitcher() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    // tenants
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((d) => {
        const items: TenantItem[] = (d.tenants || []).map((t: any) => ({ id: t.id, name: t.name }));
        setTenants(items);
      })
      .catch(() => {});
    // current tenant from cookie via lightweight endpoint (fallback: read cookie on server render)
    // we do a no-op fetch to get cookie in client; alternatively keep null and let server set default
    setCurrent(null);
  }, []);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setCurrent(id);
    await fetch("/api/tenants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: id }),
    });
    location.reload();
  }

  return (
    <select
      className="rounded border bg-transparent px-2 py-1 text-sm"
      value={current || ""}
      onChange={onChange}
    >
      <option value="" disabled>
        Tenant seç
      </option>
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}






