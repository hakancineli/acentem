import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if ((email === "admin@example.com" || email === "super@example.com") && password === "demodemo") {
    const role = email === "super@example.com" ? "super" : "admin";
    const res = NextResponse.json({ ok: true, role });
    res.cookies.set("auth-token", "demo", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    res.cookies.set("role", role, { path: "/", sameSite: "lax" });
    return res;
  }

  return NextResponse.json({ ok: false, error: "Geçersiz bilgiler" }, { status: 401 });
}


