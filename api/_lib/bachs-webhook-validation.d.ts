export interface BachsEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export function isValidBachsEventEnvelope(event: unknown): event is BachsEvent;
export function getBachsCheckoutId(data: Record<string, unknown> | null | undefined): string;
export function matchesBachsSuccessfulPayment(
  data: Record<string, unknown> | null | undefined,
  order: { amount_minor: number | string | bigint; currency: string }
): boolean;
export function isWithinBachsIdempotencyWindow(createdAt: string | Date, now?: number | Date): boolean;
export function parseBachsRefundEvent(event: unknown): {
  reference: string;
  refundId: string;
  chargeId: string;
  currency: string;
  amountMinor: number;
  status: "successful" | "failed" | "pending";
} | null;
