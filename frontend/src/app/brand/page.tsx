"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  getAuthUser,
  Campaign,
  Milestone,
  User,
} from "@/app/lib/api";

const DEFAULT_PRESET_MILESTONES: Milestone[] = [
  { views: 10000, payout: 500 },
  { views: 50000, payout: 2000 },
  { views: 100000, payout: 5000 },
];

export default function BrandDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Create Campaign Form state
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"Instagram" | "YouTube">("Instagram");
  const [totalBudget, setTotalBudget] = useState<number | "">("");
  const [milestones, setMilestones] = useState<Milestone[]>([
    ...DEFAULT_PRESET_MILESTONES,
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    if (activeUser.role !== "brand") {
      router.push("/creator");
      return;
    }
    setUser(activeUser);
    loadCampaigns();
  }, [router]);

  async function loadCampaigns() {
    try {
      setLoading(true);
      const res = await apiRequest<{ campaigns: Campaign[] }>("/campaigns/my");
      setCampaigns(res.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  function handleAddMilestone() {
    const last = milestones[milestones.length - 1];
    const nextViews = last ? last.views + 25000 : 10000;
    const nextPayout = last ? last.payout + 1000 : 500;
    setMilestones([...milestones, { views: nextViews, payout: nextPayout }]);
  }

  function handleRemoveMilestone(index: number) {
    if (milestones.length <= 1) {
      setFormError("At least one milestone is required.");
      return;
    }
    setMilestones(milestones.filter((_, i) => i !== index));
  }

  function handleMilestoneChange(
    index: number,
    field: "views" | "payout",
    value: number
  ) {
    const updated = [...milestones];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setMilestones(updated);
  }

  function handlePresetMilestones() {
    setMilestones([...DEFAULT_PRESET_MILESTONES]);
  }

  async function handleCreateCampaign(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!name.trim()) {
      setFormError("Campaign name is required.");
      return;
    }

    if (!totalBudget || Number(totalBudget) <= 0) {
      setFormError("Please enter a valid total budget greater than 0.");
      return;
    }

    // Validate milestones
    for (let i = 0; i < milestones.length; i++) {
      if (milestones[i].views <= 0 || milestones[i].payout < 0) {
        setFormError("All milestones must have positive views and non-negative payouts.");
        return;
      }
      if (i > 0 && milestones[i].views <= milestones[i - 1].views) {
        setFormError(
          `Milestone #${i + 1} view threshold (${milestones[i].views}) must be strictly higher than milestone #${i} (${milestones[i - 1].views}).`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await apiRequest<{ campaign: Campaign }>("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          platform,
          totalBudget: Number(totalBudget),
          milestones,
        }),
      });

      setFormSuccess(`Campaign "${name.trim()}" created successfully!`);
      setName("");
      setTotalBudget("");
      setMilestones([...DEFAULT_PRESET_MILESTONES]);
      await loadCampaigns();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  // Aggregate metrics
  const totalCampaignsCount = campaigns.length;
  const totalAllocatedBudget = campaigns.reduce((acc, c) => acc + c.totalBudget, 0);
  const totalSpentBudget = campaigns.reduce((acc, c) => acc + c.spentBudget, 0);
  const totalRemainingBudget = Math.max(0, totalAllocatedBudget - totalSpentBudget);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
        Authenticating...
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Brand Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your campaigns, configure milestone payouts, and monitor budget utilization.
          </p>
        </div>
        <button
          onClick={loadCampaigns}
          className="self-start sm:self-auto text-xs font-bold px-3.5 py-2 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 rounded-xl text-slate-700 dark:text-slate-200 shadow-xs hover:shadow hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-1.5 transition-all duration-150"
        >
          <span>🔄</span> Refresh Data
        </button>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Campaigns
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {totalCampaignsCount}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Active brand campaigns</div>
        </div>

        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Allocated Budget
          </div>
          <div className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400 mt-1">
            ₹{totalAllocatedBudget.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Across all campaigns</div>
        </div>

        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Budget Spent
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 mt-1">
            ₹{totalSpentBudget.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {totalAllocatedBudget > 0
              ? `${((totalSpentBudget / totalAllocatedBudget) * 100).toFixed(1)}% utilized`
              : "0% utilized"}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111726] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Remaining Budget
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalRemainingBudget.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Available for creators</div>
        </div>
      </div>

      {/* Main Grid: Create Campaign Form & Campaigns List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Campaign Form (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111726] p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>✨</span> Create New Campaign
            </h2>
            <button
              type="button"
              onClick={handlePresetMilestones}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 underline cursor-pointer"
            >
              Reset Example Ladder
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Diwalilicious Viral Reels"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c121e] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value as "Instagram" | "YouTube")
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white bg-white dark:bg-[#0c121e] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={totalBudget}
                  onChange={(e) =>
                    setTotalBudget(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g. 50000"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c121e] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                />
              </div>
            </div>

            {/* Milestone Ladder Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Milestone Ladder (Tiered Payouts)
                </label>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 cursor-pointer transition hover:scale-105"
                >
                  + Add Tier
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                Views must be strictly increasing. Highest crossed tier is paid.
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-[#0c121e] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="text-xs font-bold text-slate-400 w-5">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        Views Required
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={m.views}
                        onChange={(e) =>
                          handleMilestoneChange(idx, "views", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-[#111726] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                        Payout (₹)
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={m.payout}
                        onChange={(e) =>
                          handleMilestoneChange(idx, "payout", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-[#111726] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 text-sm cursor-pointer transition hover:scale-110"
                        title="Remove tier"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Creating Campaign..." : "Publish Campaign"}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Campaigns & Spent vs Remaining (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Your Active Campaigns ({campaigns.length})
            </h2>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white dark:bg-[#111726] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-400">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white dark:bg-[#111726] p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <div className="text-3xl">🎯</div>
              <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                No campaigns published yet
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Use the form on the left to launch your first creator campaign with milestone ladders.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((camp) => {
                const spent = camp.spentBudget || 0;
                const remaining = Math.max(0, camp.totalBudget - spent);
                const percentSpent = Math.min(
                  100,
                  Math.round((spent / camp.totalBudget) * 100)
                );

                return (
                  <div
                    key={camp._id}
                    className="bg-white dark:bg-[#111726] p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-800/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {camp.name}
                          </h3>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              camp.platform === "Instagram"
                                ? "bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/60"
                                : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60"
                            }`}
                          >
                            {camp.platform}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          ID: {camp._id} • {new Date(camp.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Total Budget
                        </span>
                        <div className="font-black text-lg text-slate-900 dark:text-white">
                          ₹{camp.totalBudget.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Budget Spent vs Remaining */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-amber-600 dark:text-amber-400">
                          Spent: ₹{spent.toLocaleString("en-IN")} ({percentSpent}%)
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Remaining: ₹{remaining.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestone Ladder Pills */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Milestone Ladder
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {camp.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 hover:border-violet-300 dark:hover:border-violet-700 transition"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {(m.views / 1000).toLocaleString()}k views
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-black text-violet-600 dark:text-violet-400">
                              ₹{m.payout.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
