export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
  requestId?: string;
  timestamp?: string;
  path?: string;
}
