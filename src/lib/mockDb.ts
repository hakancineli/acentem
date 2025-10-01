import type { Tenant, ModuleKey } from "./types";

const defaultModules: Record<ModuleKey, boolean> = {
  dashboard: true,
  policies: true,
  offers: true,
  collections: true,
  reports: true,
  users: true,
};

export const tenants: Tenant[] = [
  { id: "t1", name: "Acente A", modules: { ...defaultModules, reports: false } },
  { id: "t2", name: "Acente B", modules: { ...defaultModules, offers: false, collections: false } },
];

export function getTenantById(id: string | null | undefined): Tenant | null {
  if (!id) return null;
  return tenants.find((t) => t.id === id) ?? null;
}

export function toggleModule(tenantId: string, key: ModuleKey, enabled: boolean) {
  const t = tenants.find((x) => x.id === tenantId);
  if (!t) return false;
  t.modules[key] = enabled;
  return true;
}
