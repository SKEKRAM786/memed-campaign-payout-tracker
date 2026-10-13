"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthUser, clearAuth, User } from "@/app/lib/api";
import ThemeToggle from "./ThemeToggle";

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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-violet-500/20 group-hover:scale-105 group-hover:shadow-violet-500/40 transition-all duration-200">
              M
            </span>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Meme&apos;d{" "}
              <span className="text-violet-600 dark:text-violet-400 font-semibold text-xs tracking-wider uppercase px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800">
                Payouts
              </span>
            </span>
          </Link>

          {mounted && user && (
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
              {user.role === "brand" ? (
                <Link
                  href="/brand"
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    pathname === "/brand"
                      ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800/60"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  Brand Dashboard
                </Link>
              ) : (
                <Link
                  href="/creator"
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 ${
                    pathname === "/creator"
                      ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold border border-violet-200 dark:border-violet-800/60"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  Creator Dashboard
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          {mounted && user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {user.name}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                  {user.role}
                </span>
              </div>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-bold border tracking-wide uppercase ${
                  user.role === "brand"
                    ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                }`}
              >
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-800 transition-all cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-95 px-4 py-2 rounded-xl shadow-sm hover:shadow-violet-500/25 hover:shadow-md transition-all duration-150"
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
