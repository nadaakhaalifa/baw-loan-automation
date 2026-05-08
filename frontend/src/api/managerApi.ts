import axios from "axios";

import type { WorkflowTask } from "../types/task";

const API_BASE_URL = "http://127.0.0.1:8001";

export async function getManagerTasks(
  token: string
): Promise<WorkflowTask[]> {
  const response = await axios.get<WorkflowTask[]>(
    `${API_BASE_URL}/manager/tasks`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function approveTask(
  token: string,
  taskId: number
) {
  const response = await axios.post(
    `${API_BASE_URL}/manager/tasks/${taskId}/decision`,
    {
      decision: "APPROVE",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function rejectTask(
  token: string,
  taskId: number
) {
  const response = await axios.post(
    `${API_BASE_URL}/manager/tasks/${taskId}/decision`,
    {
      decision: "REJECT",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}