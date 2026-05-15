export interface ApiErrorItem {
  field?: string;
  message: string;
}

export type ApiSuccessBody<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: ApiErrorItem[];
};

export function ok<T>(data: T, message?: string): ApiSuccessBody<T> {
  const body: ApiSuccessBody<T> = { success: true, data };
  if (message !== undefined && message !== "") {
    body.message = message;
  }
  return body;
}

export function fail(message: string, errors?: ApiErrorItem[]): ApiErrorBody {
  const body: ApiErrorBody = { success: false, message };
  if (errors?.length) {
    body.errors = errors;
  }
  return body;
}
