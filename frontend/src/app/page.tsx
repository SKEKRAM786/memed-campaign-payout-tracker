"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthUser, User } from "@/app/lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeUser = getAuthUser();
    setUser(activeUser);
    setLoading(false);
  }, []);

  return (
    <main className="relative flex-1 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100/80 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-bold tracking-wide uppercase mb-6 shadow-xs hover:scale-105 transition-transform duration-200">
          <span>🚀 Creator Marketplace &amp; Payout Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Turn Content Views into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500">
            Verified Milestone Payouts
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
          Brands launch high-impact campaigns with strict budget caps. Creators submit posts on Instagram &amp; YouTube and unlock tiered payouts as views climb.
        </p>

        {loading ? (
          <div className="mt-10 text-sm text-slate-400">Loading platform...</div>
        ) : user ? (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user.role === "brand" ? "/brand" : "/creator"}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-base"
            >
              Go to Your {user.role === "brand" ? "Brand" : "Creator"} Dashboard →
            </Link>
          </div>
        ) : (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-base"
            >
              Get Started Free →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-100 font-bold shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-base"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}
      </div>

      {/* Role Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Brand Card */}
        <div className="group rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111726] p-8 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-300 dark:hover:border-purple-600/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
              🏢
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              For Brands
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Create campaigns on Instagram or YouTube. Set total budgets and structured milestone ladders with view thresholds and payouts.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-8 font-medium">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">✓</span>
                <span>Real-time budget spent vs. remaining tracker</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">✓</span>
                <span>Strict budget capping safeguards &amp; concurrency lock</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">✓</span>
                <span>Tiered ladder payout rules with zero overspend</span>
              </li>
            </ul>
          </div>
          <Link
            href="/brand"
            className="w-full text-center py-3 px-4 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-sm transition-all duration-200"
          >
            Launch Campaign as Brand →
          </Link>
        </div>

        {/* Creator Card */}
        <div className="group rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111726] p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-300 dark:hover:border-emerald-600/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
              🎨
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              For Creators
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Explore active campaigns, submit your post links, and watch your earnings automatically increase as your posts hit higher milestone tiers.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-8 font-medium">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">✓</span>
                <span>Browse live campaigns and milestone ladders</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">✓</span>
                <span>Transparent total earnings dashboard</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">✓</span>
                <span>Interactive view simulator for real-time testing</span>
              </li>
            </ul>
          </div>
          <Link
            href="/creator"
            className="w-full text-center py-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-sm transition-all duration-200"
          >
            Earn Payouts as Creator →
          </Link>
        </div>
      </div>
    </main>
  );
}
