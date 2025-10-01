import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hoş geldiniz</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Yönetim arayüzünü kademeli olarak oluşturuyoruz. Aşağıdan sayfalara geçebilirsiniz.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/dashboard" className="p-4 rounded border hover:bg-neutral-50 dark:hover:bg-neutral-900">
          <div className="font-medium">Dashboard</div>
          <div className="text-sm text-neutral-500">Genel görünüm ve widget'lar</div>
        </Link>
        <Link href="/login" className="p-4 rounded border hover:bg-neutral-50 dark:hover:bg-neutral-900">
          <div className="font-medium">Giriş</div>
          <div className="text-sm text-neutral-500">Demo kullanıcı ile oturum</div>
        </Link>
      </div>
    </div>
  );
}
