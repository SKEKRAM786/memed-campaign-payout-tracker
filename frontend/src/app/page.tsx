"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthUser, User } from "@/app/lib/api";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeUser = getAuthUser();
    setUser(activeUser);
    setLoading(false);
  }, []);

  return (
    <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-4">
          <span>🚀 Creator Marketplace & Payout Platform</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
          Turn Content Views into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
            Verified Milestone Payouts
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed">
          Brands launch high-impact campaigns with strict budget caps. Creators submit posts on Instagram & YouTube and unlock tiered payouts as views climb.
        </p>

        {loading ? (
          <div className="mt-8 text-sm text-zinc-400">Loading platform...</div>
        ) : user ? (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user.role === "brand" ? "/brand" : "/creator"}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm hover:shadow transition text-base"
            >
              Go to Your {user.role === "brand" ? "Brand" : "Creator"} Dashboard →
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm hover:shadow transition text-base"
            >
              Get Started Free →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-800 font-semibold shadow-xs transition text-base"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Brand Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xs hover:border-violet-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-2xl mb-4">
              🏢
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">For Brands</h2>
            <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
              Create and run campaigns on Instagram or YouTube. Set total budgets and structured milestone ladders with view thresholds and payouts.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600 mb-6 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Real-time budget spent vs. remaining tracker
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Automatic budget capping safeguards
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Multi-milestone tiered payouts
              </li>
            </ul>
          </div>
          <Link
            href="/brand"
            className="w-full text-center py-2.5 px-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm transition"
          >
            Open Brand Dashboard
          </Link>
        </div>

        {/* Creator Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl mb-4">
              🎨
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">For Creators</h2>
            <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
              Explore active campaigns, submit your post links, and watch your earnings automatically increase as your posts hit higher milestone tiers.
            </p>
            <ul className="space-y-2 text-xs text-zinc-600 mb-6 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Browse live campaigns and milestone ladders
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Transparent total earnings dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Interactive view simulator for fast testing
              </li>
            </ul>
          </div>
          <Link
            href="/creator"
            className="w-full text-center py-2.5 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm transition"
          >
            Open Creator Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
