import { useEffect, useState } from "react";

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

function ManagerPage() {
  const [items, setItems] = useState<ManagerTaskView[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      const tasks = await getManagerTasks(token);

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

  async function handleApprove(taskId: number) {
    const token = getToken();

    if (!token) {
      return;
    }

    await approveTask(token, taskId);
    await loadTasks();
  }

  async function handleReject(taskId: number) {
    const token = getToken();

    if (!token) {
      return;
    }

    await rejectTask(token, taskId);
    await loadTasks();
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

    if (ratio <= 3) {
      return "Low risk";
    }

    if (ratio <= 6) {
      return "Medium risk";
    }

    return "High risk";
  }

  function getRiskBadgeClass(loan: LoanApplication) {
    const risk = getRiskLabel(loan);

    if (risk === "Low risk") {
      return "bg-green-100 text-green-700";
    }

    if (risk === "Medium risk") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-red-100 text-red-700";
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <AppLayout title="Manager Dashboard">
      <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-800">
          Manager Approval Inbox
        </h3>

        <p className="text-gray-500 mt-1">
          Review high-value loan applications that exceed the automatic approval limit.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading approval tasks...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">
          No pending manager approval tasks.
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

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getRiskBadgeClass(
                        loan
                      )}`}
                    >
                      {getRiskLabel(loan)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-xs text-gray-500">Requested Amount</p>
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

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      Why manager approval is required
                    </p>

                    <p className="text-sm text-blue-700">
                      This request was routed to a manager because the loan amount exceeds
                      the automatic approval limit of $50,000. The manager should review
                      salary, employment type, purpose details, and repayment risk before
                      making a decision.
                    </p>
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

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(task.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-semibold transition"
                    >
                      Approve Loan
                    </button>

                    <button
                      onClick={() => handleReject(task.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-semibold transition"
                    >
                      Reject Loan
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default ManagerPage;