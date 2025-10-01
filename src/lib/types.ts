export type ModuleKey =
  | "dashboard"
  | "policies"
  | "offers"
  | "collections"
  | "reports"
  | "users"
  | "arac";

export type Tenant = {
  id: string;
  name: string;
  modules: Record<ModuleKey, boolean>;
};

export type TenancyState = {
  currentTenantId: string | null;
};
