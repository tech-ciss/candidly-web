export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
  timestamp?: string;
  path?: string;
}
