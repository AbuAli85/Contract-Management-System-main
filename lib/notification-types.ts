export interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user_email?: string | null;
  related_contract_id?: string | null;
  user_id?: string | null;
  read?: boolean;
}
