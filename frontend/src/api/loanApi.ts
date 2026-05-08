import axios from "axios";

import type { CreateLoanRequest, LoanApplication } from "../types/loan";

const API_BASE_URL = "http://127.0.0.1:8001";

export async function createLoan(
  token: string,
  payload: CreateLoanRequest
): Promise<LoanApplication> {
  const response = await axios.post<LoanApplication>(
    `${API_BASE_URL}/loan-applications`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getLoans(token: string): Promise<LoanApplication[]> {
  const response = await axios.get<LoanApplication[]>(
    `${API_BASE_URL}/loan-applications`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getLoanById(
  token: string,
  loanId: number
): Promise<LoanApplication> {
  const response = await axios.get<LoanApplication>(
    `${API_BASE_URL}/loan-applications/${loanId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}