"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  getAuthUser,
  Campaign,
  Submission,
  User,
} from "@/app/lib/api";

export default function CreatorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Post Submission Form state
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Views update simulator state (id -> loading boolean)
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [customViewsInput, setCustomViewsInput] = useState<{ [id: string]: number }>({});
  const [simMessage, setSimMessage] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    const activeUser = getAuthUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    if (activeUser.role !== "creator") {
      router.push("/brand");
      return;
    }
    setUser(activeUser);
    loadAllData();
  }, [router]);

  async function loadAllData() {
    try {
      setLoading(true);
      setError("");
      const [campRes, subRes] = await Promise.all([
        apiRequest<{ campaigns: Campaign[] }>("/campaigns"),
        apiRequest<{ submissions: Submission[]; totalEarnings: number }>("/submissions/my"),
      ]);

      setCampaigns(campRes.campaigns);
      setSubmissions(subRes.submissions);
      setTotalEarnings(subRes.totalEarnings);

      if (campRes.campaigns.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(campRes.campaigns[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPost(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!selectedCampaignId) {
      setSubmitError("Please choose a campaign.");
      return;
    }

    if (!postUrl.trim() || !/^https?:\/\/\S+$/i.test(postUrl.trim())) {
      setSubmitError("Please enter a valid HTTP/HTTPS post URL.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest<{ submission: Submission }>("/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          postUrl: postUrl.trim(),
        }),
      });

      setSubmitSuccess("Post submitted successfully! Views simulation is now enabled below.");
      setPostUrl("");
      await loadAllData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSimulateViews(submissionId: string, newViews: number) {
    try {
      setSimulatingId(submissionId);
      setSimMessage((prev) => ({ ...prev, [submissionId]: "" }));

      const res = await apiRequest<{
        submission: Submission;
        campaignBudget: { total: number; spent: number; remaining: number };
      }>(`/submissions/${submissionId}/views`, {
        method: "PATCH",
        body: JSON.stringify({ views: newViews }),
      });

      setSimMessage((prev) => ({
        ...prev,
        [submissionId]: `Views updated to ${newViews.toLocaleString()}. Payout: ₹${res.submission.payout.toLocaleString("en-IN")} (Campaign remaining: ₹${res.campaignBudget.remaining.toLocaleString("en-IN")})`,
      }));

      // Refresh data
      await loadAllData();
    } catch (err) {
      setSimMessage((prev) => ({
        ...prev,
        [submissionId]: err instanceof Error ? err.message : "Simulation failed",
      }));
    } finally {
      setSimulatingId(null);
    }
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500">
        Authenticating...
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Earnings Highlight */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Creator Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Browse brand campaigns, submit content links, and track milestone earnings.
          </p>
        </div>

        {/* Big Earnings Widget */}
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm flex items-center gap-6 min-w-[280px]">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
              Total Creator Earnings
            </div>
            <div className="text-3xl font-black mt-1">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-emerald-200 mt-0.5">
              Across {submissions.length} submitted posts
            </div>
          </div>
          <div className="text-4xl ml-auto opacity-80">💰</div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit Post Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <h2 className="text-lg font-bold text-zinc-900 mb-1 flex items-center gap-2">
          <span>📤</span> Submit Content for Campaign
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Select an active brand campaign and paste your published post link.
        </p>

        {submitError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            {submitSuccess}
          </div>
        )}

        <form onSubmit={handleSubmitPost} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Choose Campaign
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              {campaigns.length === 0 && <option value="">No active campaigns available</option>}
              {campaigns.map((camp) => (
                <option key={camp._id} value={camp._id}>
                  {camp.name} ({camp.platform}) — Rem. Budget: ₹
                  {Math.max(0, camp.totalBudget - camp.spentBudget).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Post URL (Instagram / YouTube)
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://instagram.com/reel/C2..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting || campaigns.length === 0}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-violet-600 hover:bg-violet-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Post"}
            </button>
          </div>
        </form>
      </div>

      {/* My Submissions & Interactive Views Simulator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span>🎬</span> My Submissions &amp; Milestone Payouts ({submissions.length})
          </h2>
          <span className="text-xs text-zinc-500 font-medium">
            Simulate views to test payout ladder &amp; budget caps live
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2">
            <div className="text-3xl">📭</div>
            <div className="text-base font-semibold text-zinc-800">
              No content submitted yet
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Submit your first post above or choose a campaign from the live campaigns below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((sub) => {
              const camp =
                typeof sub.campaignId === "object" ? sub.campaignId : null;
              const currentViews = sub.views;
              const customViews =
                customViewsInput[sub._id] !== undefined
                  ? customViewsInput[sub._id]
                  : currentViews + 10000;

              return (
                <div
                  key={sub._id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 text-base">
                          {camp ? camp.name : "Campaign"}
                        </span>
                        {camp && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              camp.platform === "Instagram"
                                ? "bg-pink-50 text-pink-700 border-pink-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {camp.platform}
                          </span>
                        )}
                      </div>
                      <a
                        href={sub.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-600 hover:text-violet-700 truncate max-w-md block mt-0.5 underline font-medium"
                      >
                        {sub.postUrl} ↗
                      </a>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-zinc-400 uppercase">
                          Current Views
                        </div>
                        <div className="font-extrabold text-base text-zinc-800">
                          {sub.views.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right pl-4 border-l border-zinc-200">
                        <div className="text-[11px] font-semibold text-emerald-600 uppercase">
                          Earned Payout
                        </div>
                        <div className="font-black text-xl text-emerald-600">
                          ₹{sub.payout.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone status for this campaign */}
                  {camp && camp.milestones && (
                    <div>
                      <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Campaign Milestone Ladder:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {camp.milestones.map((m, i) => {
                          const reached = sub.views >= m.views;
                          return (
                            <div
                              key={i}
                              className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
                                reached
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                  : "bg-zinc-50 border-zinc-200 text-zinc-500"
                              }`}
                            >
                              <span>{reached ? "✓" : "○"}</span>
                              <span>{(m.views / 1000).toLocaleString()}k views</span>
                              <span>→</span>
                              <span>₹{m.payout.toLocaleString("en-IN")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interactive Views Simulation Controls */}
                  <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <span>⚡</span> Simulate Views Update (PATCH /api/submissions/:id/views)
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Test milestone transitions, budget caps, and multi-tier jumps.
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick increment buttons */}
                        <button
                          type="button"
                          disabled={simulatingId === sub._id}
                          onClick={() => handleSimulateViews(sub._id, sub.views + 10000)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-zinc-300 hover:border-violet-400 text-zinc-700 shadow-xs cursor-pointer hover:bg-violet-50 transition"
                        >
                          +10k
                        </button>
                        <button
                          type="button"
                          disabled={simulatingId === sub._id}
                          onClick={() => handleSimulateViews(sub._id, sub.views + 50000)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-zinc-300 hover:border-violet-400 text-zinc-700 shadow-xs cursor-pointer hover:bg-violet-50 transition"
                        >
                          +50k
                        </button>
                        <button
                          type="button"
                          disabled={simulatingId === sub._id}
                          onClick={() => handleSimulateViews(sub._id, sub.views + 100000)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-zinc-300 hover:border-violet-400 text-zinc-700 shadow-xs cursor-pointer hover:bg-violet-50 transition"
                        >
                          +100k
                        </button>

                        {/* Custom input */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={customViews}
                            onChange={(e) =>
                              setCustomViewsInput((prev) => ({
                                ...prev,
                                [sub._id]: Number(e.target.value),
                              }))
                            }
                            className="w-24 px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900"
                          />
                          <button
                            type="button"
                            disabled={simulatingId === sub._id}
                            onClick={() => handleSimulateViews(sub._id, customViews)}
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-xs cursor-pointer disabled:opacity-50 transition"
                          >
                            {simulatingId === sub._id ? "Updating..." : "Set"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {simMessage[sub._id] && (
                      <div className="mt-2 text-xs font-medium text-violet-700 bg-violet-50 p-2 rounded-lg border border-violet-200">
                        {simMessage[sub._id]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Browse Live Campaigns Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span>🌟</span> Browse Live Campaigns ({campaigns.length})
          </h2>
          <span className="text-xs text-zinc-500">
            Available campaigns for creator submissions
          </span>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 text-center text-sm text-zinc-400">
            No active campaigns available right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((camp) => {
              const remaining = Math.max(0, camp.totalBudget - camp.spentBudget);
              const brandName =
                typeof camp.brandId === "object" && camp.brandId !== null
                  ? camp.brandId.name
                  : "Brand Partner";

              return (
                <div
                  key={camp._id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between hover:border-violet-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          camp.platform === "Instagram"
                            ? "bg-pink-50 text-pink-700 border-pink-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {camp.platform}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ₹{remaining.toLocaleString("en-IN")} Left
                      </span>
                    </div>

                    <h3 className="font-bold text-zinc-900 text-base mb-0.5">
                      {camp.name}
                    </h3>
                    <div className="text-xs text-zinc-500 mb-3">
                      By {brandName} • Total Budget: ₹
                      {camp.totalBudget.toLocaleString("en-IN")}
                    </div>

                    {/* Milestone list */}
                    <div className="space-y-1 mb-4">
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Milestone Ladder
                      </div>
                      <div className="space-y-1">
                        {camp.milestones.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-xs py-1 px-2 rounded-lg bg-zinc-50 text-zinc-700"
                          >
                            <span>{(m.views / 1000).toLocaleString()}K views</span>
                            <span className="font-bold text-violet-700">
                              ₹{m.payout.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCampaignId(camp._id);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-xs transition cursor-pointer"
                  >
                    Select &amp; Submit Post ↑
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
