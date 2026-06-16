export interface ApiFieldError {
  field: string;
  messages: string[];
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: ApiFieldError[];
}

export function extractErrorMessage(err: unknown, fallback = 'An error occurred. Please try again.'): string {
  const data = (err as any)?.response?.data as ApiErrorResponse | undefined;
  if (!data) return fallback;

  if (data.errors && data.errors.length > 0) {
    return data.errors.flatMap((e) => e.messages).join('. ');
  }

  return data.message || fallback;
}

export function extractFieldErrors(err: unknown): Record<string, string> {
  const data = (err as any)?.response?.data as ApiErrorResponse | undefined;
  if (!data?.errors) return {};
  return data.errors.reduce(
    (acc, e) => {
      acc[e.field] = e.messages[0] ?? '';
      return acc;
    },
    {} as Record<string, string>,
  );
}
