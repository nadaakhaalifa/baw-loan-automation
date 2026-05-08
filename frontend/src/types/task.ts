export interface WorkflowTask {
  id: number;
  loan_application_id: number;

  task_type: string;
  assigned_role: string;

  status: string;

  created_at: string;

  decision: string | null;
  note: string | null;

  completed_at: string | null;
}