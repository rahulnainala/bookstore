import type { OrderStatus } from "@bookstore/shared";
import { Badge } from "../components/ui";

const tones = {
  PENDING: "neutral",
  PAID: "blue",
  SHIPPED: "amber",
  DELIVERED: "green",
  CANCELLED: "red",
} as const;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={tones[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}
