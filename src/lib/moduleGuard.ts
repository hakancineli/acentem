import { cookies } from "next/headers";
import type { ModuleKey } from "./types";
import { prisma } from "./prisma";

export async function assertModuleEnabled(tenantId: string, moduleKey: ModuleKey) {
  const setting = await prisma.moduleSetting.findFirst({
    where: { tenantId, key: moduleKey },
  });
  const enabled = setting?.enabled ?? true;
  if (!enabled) {
    throw new Error(`Module ${moduleKey} is disabled for this tenant`);
  }
  return { allowed: Boolean(enabled), reason: enabled ? null : "disabled" } as const;
}


