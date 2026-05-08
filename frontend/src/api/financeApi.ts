import axios from "axios";

import type { WorkflowTask } from "../types/task";

const API_BASE_URL = "http://127.0.0.1:8001";

export async function getFinanceTasks(
  token: string
): Promise<WorkflowTask[]> {
  const response = await axios.get<WorkflowTask[]>(
    `${API_BASE_URL}/finance/tasks`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function confirmDisbursement(
  token: string,
  taskId: number
) {
  const response = await axios.post(
    `${API_BASE_URL}/finance/tasks/${taskId}/confirm-disbursement`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
