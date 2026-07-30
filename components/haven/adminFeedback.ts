import { toast } from 'sonner';

/** Soft copy for unexpected failures — never surface raw API/exception text. */
export const HAVEN_GENERIC_ERROR =
  'Oops, something went wrong. Please try again later.';

export function havenLogError(context: string, err: unknown) {
  console.error(`[Haven Admin] ${context}`, err);
}

export function havenToastError(context: string, err?: unknown) {
  if (err !== undefined) havenLogError(context, err);
  toast.error(HAVEN_GENERIC_ERROR);
}

/** Gentle, actionable guidance (validation / missing fields). */
export function havenToastHint(message: string) {
  toast.message(message);
}
