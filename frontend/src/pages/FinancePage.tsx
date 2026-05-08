import { useEffect, useState } from "react";

import AppLayout from "../layouts/AppLayout";

import {
  getFinanceTasks,
  confirmDisbursement,
} from "../api/financeApi";

import { getLoanById } from "../api/loanApi";

import { getToken } from "../utils/authStorage";

import type { WorkflowTask } from "../types/task";
import type { LoanApplication } from "../types/loan";

interface FinanceTaskView {
  task: WorkflowTask;
  loan: LoanApplication | null;
}

function FinancePage() {
  const [items, setItems] = useState<FinanceTaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  async function loadTasks() {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const tasks = await getFinanceTasks(token);

      const taskViews = await Promise.all(
        tasks.map(async (task) => {
          const loan = await getLoanById(token, task.loan_application_id);

          return {
            task,
            loan,
          };
        })
      );

      setItems(taskViews);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(taskId: number, loanId: number) {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      await confirmDisbursement(token, taskId);

      setSuccessMessage(
        `Loan #${loanId} has been disbursed successfully. The workflow was completed and a customer notification was generated.`
      );

      await loadTasks();
    } catch (error) {
      console.error(error);
    }
  }

  function getLoanRatio(loan: LoanApplication) {
    if (!loan.monthly_salary || loan.monthly_salary <= 0) {
      return "N/A";
    }

    return (loan.amount / loan.monthly_salary).toFixed(1);
  }

  function getFinanceReadinessMessage(loan: LoanApplication) {
    if (!loan.documents_complete) {
      return "This loan is not ready for disbursement because supporting documents are missing.";
    }

    if (loan.manager_decision === "APPROVED") {
      return "This loan is ready for finance disbursement because manager approval has been completed.";
    }

    if (loan.amount <= 50000) {
      return "This loan is ready for finance disbursement because it qualified for automatic approval.";
    }

    return "Finance should verify approval status, document readiness, and customer details before confirming disbursement.";
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <AppLayout title="Finance Dashboard">
      <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-800">
          Finance Disbursement Inbox
        </h3>

        <p className="text-gray-500 mt-1">
          Review approved loan applications and confirm final disbursement.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-xl bg-green-100 text-green-700 p-4">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading finance tasks...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">
          No pending finance disbursement tasks.
        </div>
      ) : (
        <div className="space-y-5">
          {items.map(({ task, loan }) => (
            <div
              key={task.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6"
            >
              {!loan ? (
                <div className="text-red-600">
                  Loan details could not be loaded.
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        Loan Application #{loan.id}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Customer: {loan.customer_name} • {loan.customer_email}
                      </p>
                    </div>

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      READY FOR DISBURSEMENT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Loan Amount</p>
                      <p className="font-bold text-slate-800">
                        ${loan.amount}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Monthly Salary</p>
                      <p className="font-bold text-slate-800">
                        ${loan.monthly_salary || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Loan / Salary Ratio</p>
                      <p className="font-bold text-slate-800">
                        {getLoanRatio(loan)}x
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Employment Type</p>
                      <p className="font-bold text-slate-800">
                        {loan.employment_type || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
                    <p className="text-sm font-semibold text-indigo-800 mb-1">
                      Finance Review Reason
                    </p>

                    <p className="text-sm text-indigo-700">
                      {getFinanceReadinessMessage(loan)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Manager Decision</p>
                      <p className="font-semibold text-slate-800">
                        {loan.manager_decision || "Auto-approved / Not required"}
                      </p>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Documents</p>
                      <p className="font-semibold text-slate-800">
                        {loan.documents_complete ? "Complete" : "Missing"}
                      </p>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Current Status</p>
                      <p className="font-semibold text-slate-800">
                        {loan.status}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <p className="text-sm font-semibold text-slate-700">
                      Purpose
                    </p>
                    <p className="text-sm text-gray-600">
                      {loan.purpose || "No purpose provided"}
                    </p>
                  </div>

                  <div className="mb-5">
                    <p className="text-sm font-semibold text-slate-700">
                      Purpose Details
                    </p>
                    <p className="text-sm text-gray-600">
                      {loan.purpose_details || "No additional details provided"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleConfirm(task.id, loan.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold transition"
                  >
                    Confirm Disbursement
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default FinancePage;