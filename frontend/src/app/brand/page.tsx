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
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500">
        Authenticating...
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Brand Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your campaigns, configure milestone payouts, and monitor budget utilization.
          </p>
        </div>
        <button
          onClick={loadCampaigns}
          className="self-start sm:self-auto text-xs font-semibold px-3 py-2 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg text-zinc-700 shadow-xs cursor-pointer flex items-center gap-1.5 transition"
        >
          <span>🔄</span> Refresh Data
        </button>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Campaigns
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
            {totalCampaignsCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Active brand campaigns</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Total Allocated Budget
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-violet-700 mt-1">
            ₹{totalAllocatedBudget.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Across all campaigns</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Budget Spent
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
            ₹{totalSpentBudget.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {totalAllocatedBudget > 0
              ? `${((totalSpentBudget / totalAllocatedBudget) * 100).toFixed(1)}% utilized`
              : "0% utilized"}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Remaining Budget
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
            ₹{totalRemainingBudget.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-zinc-400 mt-1">Available for creators</div>
        </div>
      </div>

      {/* Main Grid: Create Campaign Form & Campaigns List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Campaign Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span>✨</span> Create New Campaign
            </h2>
            <button
              type="button"
              onClick={handlePresetMilestones}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 underline cursor-pointer"
            >
              Reset Example Ladder
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Diwalilicious Viral Reels"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value as "Instagram" | "YouTube")
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
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
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
            </div>

            {/* Milestone Ladder Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Milestone Ladder (Tiered Payouts)
                </label>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                >
                  + Add Tier
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Views must be strictly increasing. Payout is paid for the highest milestone crossed.
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200"
                  >
                    <div className="text-xs font-bold text-zinc-400 w-5">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-zinc-500 mb-0.5">
                        Views Required
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={m.views}
                        onChange={(e) =>
                          handleMilestoneChange(idx, "views", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-white rounded-lg border border-zinc-300 text-xs font-medium text-zinc-900"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-zinc-500 mb-0.5">
                        Payout (₹)
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={m.payout}
                        onChange={(e) =>
                          handleMilestoneChange(idx, "payout", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 bg-white rounded-lg border border-zinc-300 text-xs font-medium text-zinc-900"
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-zinc-400 hover:text-red-500 p-1 text-sm cursor-pointer"
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
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Creating Campaign..." : "Publish Campaign"}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Campaigns & Spent vs Remaining (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span>📋</span> Your Active Campaigns ({campaigns.length})
            </h2>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center text-sm text-zinc-400">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
              <div className="text-3xl">🎯</div>
              <div className="text-base font-semibold text-zinc-800">
                No campaigns published yet
              </div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
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
                    className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs hover:border-violet-200 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-zinc-900">
                            {camp.name}
                          </h3>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              camp.platform === "Instagram"
                                ? "bg-pink-50 text-pink-700 border-pink-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {camp.platform}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          ID: {camp._id} • Created{" "}
                          {new Date(camp.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-zinc-500">
                          Total Budget
                        </span>
                        <div className="font-extrabold text-base text-zinc-900">
                          ₹{camp.totalBudget.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Budget Spent vs Remaining */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-amber-700 font-semibold">
                          Spent: ₹{spent.toLocaleString("en-IN")} ({percentSpent}%)
                        </span>
                        <span className="text-emerald-700 font-semibold">
                          Remaining: ₹{remaining.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-red-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestone Ladder Pills */}
                    <div className="pt-2 border-t border-zinc-100">
                      <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        Milestone Ladder
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {camp.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5"
                          >
                            <span className="font-semibold text-zinc-700">
                              {(m.views / 1000).toLocaleString()}k views
                            </span>
                            <span className="text-zinc-400">→</span>
                            <span className="font-bold text-violet-700">
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
