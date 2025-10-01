import { prisma } from "@/lib/prisma";
import { assertModuleEnabled } from "@/lib/moduleGuard";
import { cookies } from "next/headers";

export default async function UsersPage() {
  const { allowed } = await assertModuleEnabled("users");
  if (!allowed) {
    return (
      <div className="space-y-3">
        <div className="text-xl font-semibold">Erişim engellendi</div>
        <div className="text-sm text-neutral-500">Bu modül mevcut tenant için kapalı.</div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || null;

  const users = await prisma.user.findMany({
    where: tenantId ? { tenantId } : {},
    select: { id: true, email: true, role: true, tenantId: true },
    orderBy: { email: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
      <div className="rounded border divide-y">
        <div className="grid grid-cols-4 text-sm font-medium px-3 py-2 bg-neutral-50 dark:bg-neutral-900">
          <div>E-posta</div>
          <div>Rol</div>
          <div>Tenant</div>
          <div>ID</div>
        </div>
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-4 text-sm px-3 py-2">
            <div>{u.email}</div>
            <div>{String(u.role).toLowerCase()}</div>
            <div className="truncate">{u.tenantId || "—"}</div>
            <div className="truncate">{u.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



