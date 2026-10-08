import { formatPrice } from "@bookstore/shared";
import { BookCopy, DollarSign, ShoppingCart, Users } from "lucide-react";
import { Link } from "react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdminStats } from "../../api/hooks";
import { Badge, ErrorState, Skeleton } from "../../components/ui";
import { useTitle } from "../../lib/useTitle";

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5">
      <div className="muted flex items-center gap-2 text-sm">
        <Icon className="size-4" aria-hidden /> {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function Dashboard() {
  useTitle("Admin dashboard");
  const { data, isLoading, error, refetch } = useAdminStats();

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
        <Skeleton className="h-80 sm:col-span-2 lg:col-span-4" />
      </div>
    );
  }

  const last30Revenue = data.salesByDay.reduce((s, d) => s + d.revenueCents, 0);
  const chartData = data.salesByDay.map((d) => ({ ...d, revenue: d.revenueCents / 100 }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={DollarSign} label="Total revenue" value={formatPrice(data.revenueCents)} />
        <Tile icon={ShoppingCart} label="Orders" value={data.orderCount.toLocaleString()} />
        <Tile icon={Users} label="Customers" value={data.customerCount.toLocaleString()} />
        <Tile icon={BookCopy} label="Books in catalog" value={data.bookCount.toLocaleString()} />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-sans text-lg font-semibold">Revenue, last 30 days</h2>
          <span className="muted text-sm">{formatPrice(last30Revenue)} total</span>
        </div>
        <div
          className="h-72"
          role="img"
          aria-label={`Bar chart of daily revenue over the last 30 days, ${formatPrice(last30Revenue)} in total`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.15} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={24}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <YAxis
                tickFormatter={(v: number) => `$${v}`}
                tick={{ fontSize: 12 }}
                width={56}
                stroke="currentColor"
                strokeOpacity={0.4}
              />
              <Tooltip
                cursor={{ fillOpacity: 0.08 }}
                labelFormatter={(l) => shortDate(String(l))}
                formatter={(v, _n, item) => [
                  `${formatPrice(Number(v) * 100)} · ${item.payload.orders} orders`,
                  "Revenue",
                ]}
                contentStyle={{ borderRadius: 8, fontSize: 13, color: "#1c1917" }}
              />
              <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold">Top sellers</h2>
          <table className="w-full text-sm">
            <thead className="muted text-left text-xs uppercase">
              <tr>
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 text-right font-medium">Units</th>
                <th className="pb-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topSellers.map((t) => (
                <tr
                  key={`${t.bookId}-${t.title}`}
                  className="border-t border-stone-200 dark:border-stone-800"
                >
                  <td className="py-2 pr-2">{t.title}</td>
                  <td className="py-2 text-right tabular-nums">{t.unitsSold}</td>
                  <td className="py-2 text-right tabular-nums">{formatPrice(t.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold">Low stock</h2>
          {data.lowStock.length === 0 ? (
            <p className="muted text-sm">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.lowStock.map((b) => (
                <li key={b.bookId} className="flex items-center justify-between gap-2">
                  <Link to={`/admin/books/${b.bookId}`} className="hover:underline">
                    {b.title}
                  </Link>
                  <Badge tone={b.stock === 0 ? "red" : "amber"}>
                    {b.stock === 0 ? "Sold out" : `${b.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
