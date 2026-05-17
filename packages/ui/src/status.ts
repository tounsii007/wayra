import type { Departure } from '@wayra/types';
import { colors } from './tokens';

export type StatusVariant = 'onTime' | 'delay' | 'severe' | 'info' | 'cancelled';

export function statusForDeparture(d: Departure): StatusVariant {
  if (d.cancelled) return 'cancelled';
  if (d.delaySeconds === undefined) return 'info';
  if (d.delaySeconds <= 60) return 'onTime';
  if (d.delaySeconds <= 5 * 60) return 'delay';
  return 'severe';
}

export const statusColor: Record<StatusVariant, string> = {
  onTime: colors.status.onTime,
  delay: colors.status.delay,
  severe: colors.status.severe,
  info: colors.status.info,
  cancelled: colors.status.cancelled,
};
