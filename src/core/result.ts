export interface CommandResult<T = Record<string, unknown>> {
  ok: boolean;
  command: string;
  data?: T;
  errors?: Array<{ code: string; message: string; path?: string }>;
}
