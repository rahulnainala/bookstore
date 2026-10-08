import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice, ORDER_STATUSES, type Order, type OrderStatus } from "@bookstore/shared";
import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError, v1 } from "../../api/client";
import { useAdminOrders } from "../../api/hooks";
import { Pagination } from "../../components/Pagination";
import { ErrorState, Skeleton } from "../../components/ui";
import { useTitle } from "../../lib/useTitle";

export default function AdminOrders() {
  useTitle("Orders");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAdminOrders(page);

  const setStatus = useMutation({
    mutationFn: ({ order, status }: { order: Order; status: OrderStatus }) =>
      api(v1(`/admin/orders/${order.id}`), { method: "PATCH", body: { status } }),
    onSuccess: (_d, { order, status }) => {
      toast.success(`Order #${order.id} marked ${status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Update failed"),
  });

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="muted border-b border-stone-200 text-left text-xs uppercase dark:border-stone-800">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Items</th>
              <th className="p-3 text-right font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || !data
              ? Array.from({ length: 10 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-3">
                      <Skeleton className="h-6" />
                    </td>
                  </tr>
                ))
              : data.items.map((o) => (
                  <tr key={o.id} className="border-t border-stone-200 dark:border-stone-800">
                    <td className="p-3 font-medium">#{o.id}</td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </td>
                    <td className="p-3">
                      <p>{o.customer?.name}</p>
                      <p className="muted text-xs">{o.customer?.email}</p>
                    </td>
                    <td
                      className="max-w-56 truncate p-3"
                      title={o.items.map((i) => `${i.quantity} × ${i.title}`).join("\n")}
                    >
                      {o.items.reduce((n, i) => n + i.quantity, 0)} ·{" "}
                      {o.items.map((i) => i.title).join(", ")}
                    </td>
                    <td className="p-3 text-right tabular-nums">{formatPrice(o.totalCents)}</td>
                    <td className="p-3">
                      <label htmlFor={`status-${o.id}`} className="sr-only">
                        Status of order {o.id}
                      </label>
                      <select
                        id={`status-${o.id}`}
                        className="input w-auto py-1"
                        value={o.status}
                        disabled={o.status === "CANCELLED" || setStatus.isPending}
                        onChange={(e) => {
                          const status = e.target.value as OrderStatus;
                          if (
                            status === "CANCELLED" &&
                            !confirm(`Cancel order #${o.id}? Its books go back into stock.`)
                          )
                            return;
                          setStatus.mutate({ order: o, status });
                        }}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}
