export interface LoanApplication {
  id: number;
  customer_name: string;
  customer_email: string;
  amount: number;
  monthly_salary: number | null;
  employment_type: string | null;
  purpose: string | null;
  purpose_details: string | null;
  documents_complete: boolean;
  status: string;
  manager_decision: string | null;
  finance_decision: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateLoanRequest {
  customer_name: string;
  customer_email: string;
  amount: number;
  monthly_salary: number;
  employment_type: string;
  purpose: string;
  purpose_details: string;
  documents_complete: boolean;
}