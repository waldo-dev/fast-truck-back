import { createHash } from 'crypto';
import { AppError } from '../../shared/errors';
import { OrderStatus } from '../../shared/database/models/enums';

/** Stable across JSON property order; the same key must describe the same purchase. */
export function orderFingerprint(value: unknown): string {
  const canonical = (input: any): any =>
    Array.isArray(input)
      ? input.map(canonical)
      : input && typeof input === 'object'
        ? Object.fromEntries(
            Object.keys(input)
              .sort()
              .filter(key => input[key] !== undefined && key !== 'request_key')
              .map(key => [key, canonical(input[key])])
          )
        : input;
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}

export function assertOrderTransition(
  current: OrderStatus,
  next: OrderStatus
): void {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    CREATED: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    READY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    DELIVERED: [],
    CANCELLED: [],
  };
  if (current !== next && !transitions[current].includes(next)) {
    throw new AppError(
      'El pedido cambió de estado. Actualiza la lista antes de continuar.',
      409
    );
  }
}

export function calculateEventResult(
  sales: number,
  expenses: number,
  items: Array<{ cost: number | string | null }>
): {
  ingredient_cost: number;
  cost_coverage_complete: boolean;
  margin: number | null;
  margin_pct: number | null;
} {
  const complete =
    items.length > 0 &&
    items.every(
      item => item.cost !== null && Number.isFinite(Number(item.cost))
    );
  const cost = items.reduce((sum, item) => sum + Number(item.cost ?? 0), 0);
  const margin = complete ? sales - expenses - cost : null;
  return {
    ingredient_cost: cost,
    cost_coverage_complete: complete,
    margin,
    margin_pct: margin === null ? null : sales > 0 ? margin / sales : 0,
  };
}
