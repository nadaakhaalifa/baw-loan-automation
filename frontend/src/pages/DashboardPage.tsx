import { useEffect, useMemo, useState } from "react";

import AppLayout from "../layouts/AppLayout";
import { createLoan, getLoans } from "../api/loanApi";
import { getToken } from "../utils/authStorage";

import type { LoanApplication, CreateLoanRequest } from "../types/loan";

type StoredUser = {
  full_name?: string;
  email?: string;
  role?: string;
};

function DashboardPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = useMemo<StoredUser>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : {};
  }, []);

  const [formData, setFormData] = useState<CreateLoanRequest>({
    customer_name: currentUser.full_name || "",
    customer_email: currentUser.email || "",
    amount: 0,
    monthly_salary: 0,
    employment_type: "",
    purpose: "",
    purpose_details: "",
    documents_complete: true,
  });

  async function loadLoans() {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const data = await getLoans(token);
      setLoans(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not load your loan applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLoans();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const token = getToken();

      if (!token) {
        setErrorMessage("You must login first.");
        return;
      }

      setSubmitting(true);
      setSuccessMessage("");
      setErrorMessage("");

      await createLoan(token, formData);

      setSuccessMessage(
        formData.amount > 50000
          ? "Loan submitted successfully. Because the amount exceeds $50,000, it has been routed to manager approval."
          : "Loan submitted successfully. The automated workflow has started."
      );

      setFormData({
        customer_name: currentUser.full_name || "",
        customer_email: currentUser.email || "",
        amount: 0,
        monthly_salary: 0,
        employment_type: "",
        purpose: "",
        purpose_details: "",
        documents_complete: true,
      });

      await loadLoans();
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to submit loan application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalLoans = loans.length;
  const completedLoans = loans.filter((loan) => loan.status === "COMPLETED").length;
  const rejectedLoans = loans.filter((loan) => loan.status === "REJECTED").length;
  const activeLoans = loans.filter(
    (loan) => loan.status !== "COMPLETED" && loan.status !== "REJECTED"
  ).length;

  return (
    <AppLayout title="">
      <div className="-m-6 min-h-screen overflow-hidden bg-[#050816] p-6 text-white">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-[-10%] top-[-10%] h-[520px] w-[520px] rounded-full bg-blue-600/25 blur-[130px]" />
          <div className="absolute bottom-[-15%] right-[-10%] h-[520px] w-[520px] rounded-full bg-violet-600/25 blur-[130px]" />
          <div className="absolute left-[40%] top-[20%] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[110px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative z-10">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Customer Workspace
              </div>

              <h1 className="text-5xl font-black tracking-tight text-white">
                Loan Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                Submit applications, monitor approvals, receive real email
                notifications, and track every step of your automated workflow.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-[1.75rem] border border-white/10 bg-white/10 px-5 py-4 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-violet-600 text-xl font-black text-white shadow-lg shadow-cyan-500/30">
                {(currentUser.full_name || currentUser.email || "U")[0]?.toUpperCase()}
              </div>

              <div>
                <p className="text-sm font-black text-white">
                  {currentUser.full_name || "Logged User"}
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  {currentUser.email || "No email"} • {currentUser.role || "USER"}
                </p>
              </div>

              <div className="ml-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                Online
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard title="Total Loans" value={totalLoans} icon="◆" gradient="from-cyan-500 to-blue-600" />
            <StatCard title="Active" value={activeLoans} icon="↗" gradient="from-violet-500 to-fuchsia-600" />
            <StatCard title="Completed" value={completedLoans} icon="✓" gradient="from-emerald-500 to-teal-600" />
            <StatCard title="Rejected" value={rejectedLoans} icon="!" gradient="from-rose-500 to-red-600" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                    New Request
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-white">
                    Submit Loan Application
                  </h3>

                  <p className="mt-2 text-sm text-slate-300">
                    Start a new automated approval workflow.
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 p-4 text-2xl">
                  ✦
                </div>
              </div>

              {successMessage && <Alert type="success" text={successMessage} />}
              {errorMessage && <Alert type="error" text={errorMessage} />}

              <form onSubmit={handleSubmit} className="space-y-5">
                <InputField
                  label="Customer Name"
                  type="text"
                  placeholder="Example: Nada Khalifa"
                  value={formData.customer_name}
                  onChange={(value) =>
                    setFormData({ ...formData, customer_name: value })
                  }
                />

                <InputField
                  label="Customer Email"
                  type="email"
                  placeholder="Example: nada@example.com"
                  value={formData.customer_email}
                  onChange={(value) =>
                    setFormData({ ...formData, customer_email: value })
                  }
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    label="Requested Amount"
                    type="number"
                    placeholder="Example: 120000"
                    value={String(formData.amount)}
                    helper="Loans above $50,000 need manager approval."
                    onChange={(value) =>
                      setFormData({ ...formData, amount: Number(value) })
                    }
                  />

                  <InputField
                    label="Monthly Salary"
                    type="number"
                    placeholder="Example: 35000"
                    value={String(formData.monthly_salary)}
                    helper="Used to evaluate repayment ability."
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        monthly_salary: Number(value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-200">
                    Employment Type
                  </label>

                  <select
                    className="w-full rounded-2xl border border-white/10 bg-[#0B1220]/80 p-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                    value={formData.employment_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employment_type: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select employment type</option>
                    <option value="FULL_TIME">Full Time Employee</option>
                    <option value="PART_TIME">Part Time Employee</option>
                    <option value="SELF_EMPLOYED">Self Employed</option>
                    <option value="UNEMPLOYED">Unemployed</option>
                  </select>
                </div>

                <InputField
                  label="Loan Purpose"
                  type="text"
                  placeholder="Example: Business Expansion"
                  value={formData.purpose}
                  helper="Clearly explain why you need the loan."
                  onChange={(value) =>
                    setFormData({ ...formData, purpose: value })
                  }
                />

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-200">
                    Purpose Details
                  </label>

                  <textarea
                    placeholder="Describe how the money will be used in detail..."
                    className="min-h-32 w-full rounded-2xl border border-white/10 bg-[#0B1220]/80 p-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
                    value={formData.purpose_details}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purpose_details: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.documents_complete}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documents_complete: e.target.checked,
                      })
                    }
                  />
                  All required supporting documents are ready for review
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 p-4 font-black text-white shadow-[0_0_40px_rgba(59,130,246,0.45)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_65px_rgba(139,92,246,0.65)] disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">
                    {submitting
                      ? "Submitting Application..."
                      : "Submit Loan Application"}
                  </span>
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
                    Workflow Tracker
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-white">
                    Previous Applications
                  </h3>

                  <p className="mt-2 text-sm text-slate-300">
                    Track decisions, finance status, and document progress.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center font-bold text-slate-300">
                  Loading loans...
                </div>
              ) : loans.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-slate-300">
                  <div className="mb-3 text-4xl">◌</div>
                  <p className="font-bold">No loan applications found yet.</p>
                </div>
              ) : (
                <div className="max-h-[760px] space-y-4 overflow-y-auto pr-2">
                  {loans.map((loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))}
                </div>
              )}
            </section>
          </div>
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
  value: number;
  icon: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-[1.75rem] bg-gradient-to-br ${gradient} p-5 text-white shadow-2xl shadow-blue-950/30 transition hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black opacity-90">{title}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-lg font-black">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-5xl font-black">{value}</p>
    </div>
  );
}

function Alert({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <div
      className={`mb-4 rounded-2xl border p-4 text-sm font-bold ${
        type === "success"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-red-400/20 bg-red-400/10 text-red-300"
      }`}
    >
      {text}
    </div>
  );
}

function InputField({
  label,
  type,
  placeholder,
  value,
  helper,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-200">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-[#0B1220]/80 p-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />

      {helper && (
        <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
      )}
    </div>
  );
}

function LoanCard({ loan }: { loan: LoanApplication }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#0B1220]/95 to-[#111827]/95 p-5 shadow-xl shadow-blue-950/20 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-cyan-950/30">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 className="text-xl font-black text-white">Loan #{loan.id}</h4>
          <p className="text-sm font-semibold text-slate-400">
            {loan.purpose || "No purpose provided"}
          </p>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(loan.status)}`}>
          {loan.status}
        </span>
      </div>

      <p className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-medium text-slate-300">
        {getWorkflowMessage(loan)}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Amount" value={`$${loan.amount}`} />
        <Info label="Monthly Salary" value={`$${loan.monthly_salary || 0}`} />
        <Info label="Employment" value={loan.employment_type || "Not provided"} />
        <Info label="Documents" value={loan.documents_complete ? "Complete" : "Missing"} />
        <Info label="Manager" value={loan.manager_decision || "Pending"} />
        <Info label="Finance" value={loan.finance_decision || "Pending"} />
      </div>

      {loan.purpose_details && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
            Purpose Details
          </p>
          <p className="mt-1 text-sm text-slate-300">{loan.purpose_details}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  if (status === "COMPLETED") {
    return "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20";
  }

  if (status === "WAITING_MANAGER_APPROVAL") {
    return "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20";
  }

  if (status === "SENT_TO_FINANCE") {
    return "bg-violet-400/10 text-violet-300 border border-violet-400/20";
  }

  if (status === "MISSING_DOCUMENTS") {
    return "bg-amber-400/10 text-amber-300 border border-amber-400/20";
  }

  if (status === "REJECTED") {
    return "bg-red-400/10 text-red-300 border border-red-400/20";
  }

  return "bg-slate-400/10 text-slate-300 border border-slate-400/20";
}

function getWorkflowMessage(loan: LoanApplication) {
  if (loan.status === "WAITING_MANAGER_APPROVAL") {
    return "Waiting for manager approval because the amount exceeds the automatic approval limit.";
  }

  if (loan.status === "SENT_TO_FINANCE") {
    return "Approved and waiting for finance to confirm disbursement.";
  }

  if (loan.status === "COMPLETED") {
    return "Workflow completed. Finance confirmed loan disbursement.";
  }

  if (loan.status === "MISSING_DOCUMENTS") {
    return "Additional documents are required before this loan can continue.";
  }

  if (loan.status === "REJECTED") {
    return "This loan application was rejected during the approval workflow.";
  }

  return "This loan is currently being processed by the workflow engine.";
}

export default DashboardPage;