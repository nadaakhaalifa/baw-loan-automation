import { useEffect, useMemo, useState } from "react";

import AppLayout from "../layouts/AppLayout";

import {
  getManagerTasks,
  approveTask,
  rejectTask,
} from "../api/managerApi";

import { getLoanById } from "../api/loanApi";
import { getToken } from "../utils/authStorage";

import type { WorkflowTask } from "../types/task";
import type { LoanApplication } from "../types/loan";

interface ManagerTaskView {
  task: WorkflowTask;
  loan: LoanApplication | null;
}

type StoredUser = {
  full_name?: string;
  email?: string;
  role?: string;
};

function ManagerPage() {
  const [items, setItems] = useState<ManagerTaskView[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = useMemo<StoredUser>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : {};
  }, []);

  async function loadTasks() {
    try {
      const token = getToken();
      if (!token) return;

      const tasks = await getManagerTasks(token);

      const taskViews = await Promise.all(
        tasks.map(async (task) => {
          const loan = await getLoanById(token, task.loan_application_id);
          return { task, loan };
        })
      );

      setItems(taskViews);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(taskId: number) {
    const token = getToken();
    if (!token) return;

    await approveTask(token, taskId);
    await loadTasks();
  }

  async function handleReject(taskId: number) {
    const token = getToken();
    if (!token) return;

    await rejectTask(token, taskId);
    await loadTasks();
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const highRiskCount = items.filter(
    ({ loan }) => loan && getRiskLabel(loan) === "High risk"
  ).length;

  const totalValue = items.reduce((sum, item) => {
    return sum + (item.loan?.amount || 0);
  }, 0);

  return (
    <AppLayout title="">
      <div className="-m-6 min-h-screen overflow-hidden bg-[#050816] p-6 text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[-10%] top-[-10%] h-[520px] w-[520px] rounded-full bg-emerald-600/20 blur-[130px]" />
          <div className="absolute bottom-[-15%] right-[-10%] h-[520px] w-[520px] rounded-full bg-blue-600/25 blur-[130px]" />
          <div className="absolute left-[38%] top-[20%] h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-[110px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative z-10">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Manager Approval Center
              </div>

              <h1 className="text-5xl font-black tracking-tight text-white">
                Manager Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                Review high-value loan requests, assess repayment risk, approve
                qualified applications, or reject unsafe requests with real-time
                email notifications.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-4 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-blue-600 to-violet-600 text-xl font-black text-white shadow-lg shadow-emerald-500/30">
                {(currentUser.full_name || currentUser.email || "M")[0]?.toUpperCase()}
              </div>

              <div>
                <p className="text-sm font-black text-white">
                  {currentUser.full_name || "Manager User"}
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  {currentUser.email || "No email"} • {currentUser.role || "MANAGER"}
                </p>
              </div>

              <div className="ml-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                Online
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              title="Pending Tasks"
              value={items.length}
              icon="◆"
              gradient="from-blue-500 to-cyan-600"
            />

            <StatCard
              title="High Risk"
              value={highRiskCount}
              icon="!"
              gradient="from-red-500 to-rose-600"
            />

            <StatCard
              title="Total Pending Value"
              value={`$${totalValue.toLocaleString()}`}
              icon="↗"
              gradient="from-violet-500 to-fuchsia-600"
            />
          </div>

          <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                  Approval Inbox
                </p>

                <h3 className="mt-2 text-3xl font-black text-white">
                  Manager Approval Queue
                </h3>

                <p className="mt-2 text-sm text-slate-300">
                  High-value applications requiring manual manager decision.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">
                {items.length} Pending Review
              </div>
            </div>
          </section>

          {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-12 text-center font-bold text-slate-300 backdrop-blur-2xl">
              Loading approval tasks...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/20 bg-white/10 p-16 text-center text-slate-300 backdrop-blur-2xl">
              <div className="mb-4 text-5xl">✓</div>
              <p className="text-xl font-black text-white">
                No pending manager approval tasks.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                All high-value applications are currently processed.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map(({ task, loan }) => (
                <div
                  key={task.id}
                  className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-emerald-400/30"
                >
                  {!loan ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 font-bold text-red-300">
                      Loan details could not be loaded.
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="mb-2 flex items-center gap-3">
                            <h3 className="text-2xl font-black text-white">
                              Loan Application #{loan.id}
                            </h3>

                            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                              Task #{task.id}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-slate-300">
                            Customer: {loan.customer_name} • {loan.customer_email}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-4 py-2 text-xs font-black ${getRiskBadgeClass(
                            loan
                          )}`}
                        >
                          {getRiskLabel(loan)}
                        </span>
                      </div>

                      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <InfoCard
                          label="Requested Amount"
                          value={`$${Number(loan.amount).toLocaleString()}`}
                          accent="text-cyan-300"
                        />

                        <InfoCard
                          label="Monthly Salary"
                          value={`$${Number(loan.monthly_salary || 0).toLocaleString()}`}
                          accent="text-emerald-300"
                        />

                        <InfoCard
                          label="Loan / Salary Ratio"
                          value={`${getLoanRatio(loan)}x`}
                          accent="text-violet-300"
                        />

                        <InfoCard
                          label="Employment Type"
                          value={loan.employment_type || "Not provided"}
                          accent="text-amber-300"
                        />
                      </div>

                      <div className="mb-5 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
                        <p className="mb-1 text-sm font-black text-blue-300">
                          Why manager approval is required
                        </p>

                        <p className="text-sm font-medium leading-6 text-slate-300">
                          This request exceeded the automatic approval limit of
                          $50,000. Review the customer salary, employment type,
                          loan purpose, and repayment risk before making a final
                          decision.
                        </p>
                      </div>

                      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <DetailBox
                          title="Purpose"
                          text={loan.purpose || "No purpose provided"}
                        />

                        <DetailBox
                          title="Purpose Details"
                          text={loan.purpose_details || "No additional details provided"}
                        />
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => handleApprove(task.id)}
                          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-black text-white shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] hover:shadow-emerald-500/40"
                        >
                          <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-700 group-hover:translate-x-full" />
                          <span className="relative">Approve Loan</span>
                        </button>

                        <button
                          onClick={() => handleReject(task.id)}
                          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-3 font-black text-white shadow-lg shadow-red-500/25 transition hover:scale-[1.02] hover:shadow-red-500/40"
                        >
                          <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-700 group-hover:translate-x-full" />
                          <span className="relative">Reject Loan</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  gradient,
}: {
  title: string;
  value: string | number;
  icon: string;
  gradient: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] bg-gradient-to-br ${gradient} p-5 text-white shadow-2xl shadow-blue-950/30 transition hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-black opacity-90">{title}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-lg font-black">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-4xl font-black">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className={`mt-2 text-lg font-black ${accent}`}>{value}</p>
    </div>
  );
}

function DetailBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="text-sm font-medium leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function getLoanRatio(loan: LoanApplication) {
  if (!loan.monthly_salary || loan.monthly_salary <= 0) {
    return "N/A";
  }

  return (loan.amount / loan.monthly_salary).toFixed(1);
}

function getRiskLabel(loan: LoanApplication) {
  if (!loan.monthly_salary || loan.monthly_salary <= 0) {
    return "Missing salary information";
  }

  const ratio = loan.amount / loan.monthly_salary;

  if (ratio <= 3) return "Low risk";
  if (ratio <= 6) return "Medium risk";

  return "High risk";
}

function getRiskBadgeClass(loan: LoanApplication) {
  const risk = getRiskLabel(loan);

  if (risk === "Low risk") {
    return "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (risk === "Medium risk") {
    return "border border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border border-red-400/20 bg-red-400/10 text-red-300";
}

export default ManagerPage;