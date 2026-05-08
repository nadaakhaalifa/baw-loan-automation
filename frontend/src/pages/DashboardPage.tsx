import { useEffect, useState } from "react";

import AppLayout from "../layouts/AppLayout";

import { createLoan, getLoans } from "../api/loanApi";

import { getToken } from "../utils/authStorage";

import type {
  LoanApplication,
  CreateLoanRequest,
} from "../types/loan";

function DashboardPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState<CreateLoanRequest>({
    customer_name: "",
    customer_email: "",
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

      if (formData.amount > 50000) {
        setSuccessMessage(
          "Loan application submitted successfully. Because the requested amount exceeds $50,000, the request has been routed to manager approval."
        );
      } else {
        setSuccessMessage(
          "Loan application submitted successfully. The workflow has started."
        );
      }

      setFormData({
        customer_name: "",
        customer_email: "",
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

      setErrorMessage(
        "Failed to submit loan application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadgeClass(status: string) {
    if (status === "COMPLETED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "WAITING_MANAGER_APPROVAL") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "SENT_TO_FINANCE") {
      return "bg-indigo-100 text-indigo-700";
    }

    if (status === "MISSING_DOCUMENTS") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "REJECTED") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  function getWorkflowMessage(loan: LoanApplication) {
    if (loan.status === "WAITING_MANAGER_APPROVAL") {
      return "This loan is waiting for manager approval because the requested amount exceeds the automatic approval limit.";
    }

    if (loan.status === "SENT_TO_FINANCE") {
      return "The loan was approved and is now waiting for the finance team to confirm disbursement.";
    }

    if (loan.status === "COMPLETED") {
      return "The workflow is completed. Finance has confirmed the loan disbursement.";
    }

    if (loan.status === "MISSING_DOCUMENTS") {
      return "Additional documents are required before this loan can continue in the workflow.";
    }

    if (loan.status === "REJECTED") {
      return "This loan application was rejected during the approval workflow.";
    }

    return "This loan is currently being processed by the workflow engine.";
  }

  return (
    <AppLayout title="Customer Dashboard">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow border border-gray-100">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              Submit Loan Application
            </h3>

            <p className="text-gray-500 mt-1">
              Start a new automated loan workflow request.
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 rounded-xl bg-green-100 text-green-700 p-4">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-100 text-red-700 p-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Customer Name
              </label>

              <input
                type="text"
                placeholder="Example: Nada Khalifa"
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Customer Email
              </label>

              <input
                type="email"
                placeholder="Example: nada@example.com"
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.customer_email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Requested Loan Amount
                </label>

                <input
                  type="number"
                  placeholder="Example: 120000"
                  className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: Number(e.target.value),
                    })
                  }
                  required
                />

                <p className="text-xs text-gray-500 mt-1">
                  Loans above $50,000 require manager approval.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Monthly Salary
                </label>

                <input
                  type="number"
                  placeholder="Example: 35000"
                  className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.monthly_salary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_salary: Number(e.target.value),
                    })
                  }
                  required
                />

                <p className="text-xs text-gray-500 mt-1">
                  Used to evaluate repayment ability and risk level.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Employment Type
              </label>

              <select
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Loan Purpose
              </label>

              <input
                type="text"
                placeholder="Example: Business Expansion"
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purpose: e.target.value,
                  })
                }
                required
              />

              <p className="text-xs text-gray-500 mt-1">
                Clearly explain why you need the loan.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Purpose Details
              </label>

              <textarea
                placeholder="Describe how the money will be used in detail..."
                className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.purpose_details}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purpose_details: e.target.value,
                  })
                }
                rows={4}
                required
              />

              <p className="text-xs text-gray-500 mt-1">
                Large loan requests should include detailed business or financial justification.
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 p-4 rounded-xl">
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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold p-3 rounded-xl transition duration-200 shadow-sm"
            >
              {submitting
                ? "Submitting Application..."
                : "Submit Loan Application"}
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow border border-gray-100">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              Previous Loan Applications
            </h3>

            <p className="text-gray-500 mt-1">
              Track your submitted workflow requests.
            </p>
          </div>

          {loading ? (
            <div className="text-gray-500">Loading loans...</div>
          ) : loans.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
              No loan applications found yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">
                        Loan #{loan.id}
                      </h4>

                      <p className="text-sm text-gray-500">
                        {loan.purpose || "No purpose provided"}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeClass(
                        loan.status
                      )}`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4">
                    {getWorkflowMessage(loan)}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="font-semibold">${loan.amount}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Monthly Salary</p>
                      <p className="font-semibold">
                        ${loan.monthly_salary || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Employment</p>
                      <p className="font-semibold">
                        {loan.employment_type || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Documents</p>
                      <p className="font-semibold">
                        {loan.documents_complete ? "Complete" : "Missing"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Manager</p>
                      <p className="font-semibold">
                        {loan.manager_decision || "Pending"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Finance</p>
                      <p className="font-semibold">
                        {loan.finance_decision || "Pending"}
                      </p>
                    </div>
                  </div>

                  {loan.purpose_details && (
                    <div className="mt-4">
                      <p className="text-gray-500 text-sm">
                        Purpose Details
                      </p>

                      <p className="text-sm text-slate-700">
                        {loan.purpose_details}
                      </p>
                    </div>
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

export default DashboardPage;