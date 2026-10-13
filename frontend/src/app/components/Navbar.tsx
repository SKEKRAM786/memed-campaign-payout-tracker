"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthUser, clearAuth, User } from "@/app/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getAuthUser());
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="border-b border-zinc-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              M
            </span>
            <span className="font-extrabold text-xl tracking-tight text-zinc-900">
              Meme&apos;d <span className="text-violet-600 font-semibold text-sm">Payouts</span>
            </span>
          </Link>

          {mounted && user && (
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              {user.role === "brand" ? (
                <Link
                  href="/brand"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === "/brand"
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Brand Dashboard
                </Link>
              ) : (
                <Link
                  href="/creator"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === "/creator"
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Creator Dashboard
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {mounted && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-zinc-900">{user.name}</span>
                <span className="text-xs font-medium text-zinc-500 capitalize">
                  {user.role} Account
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  user.role === "brand"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {user.role.toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm font-medium text-zinc-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-zinc-200 hover:border-red-200 transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 px-3.5 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-1.5 rounded-lg shadow-xs hover:shadow transition-all"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
