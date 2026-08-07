import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { exportAnalyticsPdf } from "./utils/exportPdf.js";

const CATEGORY_COLORS = ["#0F6E56", "#B5730B", "#7C3AED", "#DB2777", "#2563EB", "#059669"];

export default function CustomerAnalytics({ customerId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transactions?customerId=${encodeURIComponent(customerId)}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, [customerId]);

  const completed = orders.filter((o) => o.status === "Completed");
  const totalSpent = completed.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = completed.length;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const byCategory = {};
  completed.forEach((o) => {
    const cat = o.productId?.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + o.totalAmount;
  });
  const categoryChartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  const handleExportPdf = () => {
    exportAnalyticsPdf({
      title: "My Spending Report",
      subtitle: customerId,
      stats: [
        { label: "Total Spent", value: `\u20b9${totalSpent.toLocaleString("en-IN")}` },
        { label: "Orders", value: totalOrders },
        { label: "Avg Order", value: `\u20b9${Math.round(avgOrderValue).toLocaleString("en-IN")}` }
      ],
      tables: [
        {
          heading: "Spending by Category",
          columns: ["Category", "Spent (\u20b9)"],
          rows: categoryChartData.map((c) => [c.name, c.value.toLocaleString("en-IN")])
        },
        {
          heading: "Order History",
          columns: ["Product", "Qty", "Total (\u20b9)", "Status", "Date"],
          rows: completed.map((o) => [
            o.productId?.name || "—",
            o.quantity,
            o.totalAmount.toLocaleString("en-IN"),
            o.status,
            new Date(o.createdAt).toLocaleDateString("en-IN")
          ])
        }
      ]
    });
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>My Spending</h1>
          <div className="sub">Your spending, orders, and category breakdown</div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={totalOrders === 0}
          style={{
            background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: totalOrders ? "pointer" : "not-allowed",
            opacity: totalOrders ? 1 : 0.5
          }}
        >
          Export as PDF
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : totalOrders === 0 ? (
        <div className="panel">
          <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>No orders yet — buy something to see your spending analytics here.</p>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total spent</div>
              <div className="stat-value mono">&#8377;{totalSpent.toLocaleString("en-IN")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Orders placed</div>
              <div className="stat-value mono">{totalOrders}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average order</div>
              <div className="stat-value mono">&#8377;{Math.round(avgOrderValue).toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 24 }}>
            <div className="panel">
              <div className="panel-head">
                <h2>Spending by category</h2>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={categoryChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {categoryChartData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `\u20b9${v.toLocaleString("en-IN")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Category breakdown</h2>
              </div>
              <table>
                <thead>
                  <tr><th>Category</th><th>Spent</th></tr>
                </thead>
                <tbody>
                  {categoryChartData.map((c, i) => (
                    <tr key={c.name}>
                      <td>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], marginRight: 8 }} />
                        {c.name}
                      </td>
                      <td className="mono">&#8377;{c.value.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
