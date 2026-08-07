import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { exportAnalyticsPdf } from "./utils/exportPdf.js";

const STATUS_CLASS = { Active: "badge-active", Pending: "badge-pending", Suspended: "badge-suspended" };

function StatCard({ label, value, delta }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value mono">{value}</div>
      {delta && <div className="stat-delta">{delta}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--navy)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
      <div style={{ opacity: 0.6, marginBottom: 2 }}>{label}</div>
      <div className="mono" style={{ fontWeight: 600 }}>&#8377;{payload[0].value.toLocaleString("en-IN")}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/transactions/analytics/baseline").then((r) => r.json()),
      fetch("/api/vendors").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json())
    ])
      .then(([baseline, v, p]) => {
        setData(baseline);
        setVendors(v);
        setProducts(p);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "var(--red)" }}>Failed to load analytics: {error}</p>;

  if (!data) {
    return (
      <div>
        <div className="topbar"><h1>Dashboard</h1></div>
        <div className="stat-grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="stat-card"><div className="skeleton" style={{ height: 44 }} /></div>)}
        </div>
      </div>
    );
  }

  const activeVendors = vendors.filter((v) => v.status === "Active").length;
  const maxQty = Math.max(...data.productPerformance.map((p) => p.quantitySold), 1);

  const handleExportPdf = () => {
    exportAnalyticsPdf({
      title: "ShopSense Dashboard Report",
      subtitle: "Revenue overview and product performance",
      stats: [
        { label: "Total Revenue", value: `\u20b9${data.totalRevenue.toLocaleString("en-IN")}` },
        { label: "Active Vendors", value: `${activeVendors} / ${vendors.length}` },
        { label: "Products Listed", value: products.length }
      ],
      tables: [
        {
          heading: "Product Performance",
          columns: ["Product", "Quantity Sold"],
          rows: data.productPerformance.map((p) => [p.name, p.quantitySold])
        },
        {
          heading: "Vendors",
          columns: ["Vendor", "Status"],
          rows: vendors.map((v) => [v.businessName, v.status])
        }
      ]
    });
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Weeks 1&ndash;2 &middot; marketplace overview</div>
        </div>
        <button
          onClick={handleExportPdf}
          style={{
            background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}
        >
          Export as PDF
        </button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total revenue" value={`\u20b9${data.totalRevenue.toLocaleString("en-IN")}`} delta="Weeks 1-2" />
        <StatCard label="Active vendors" value={`${activeVendors} / ${vendors.length}`} />
        <StatCard label="Products listed" value={products.length} />
        <StatCard label="Orders logged" value={data.productPerformance.reduce((s, p) => s + p.quantitySold, 0)} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Revenue overview</h2>
          <span className="hint">Daily, completed orders</span>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={data.revenueSeries} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F6E56" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0F6E56" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `\u20b9${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#0F6E56" strokeWidth={2} fill="url(#rev)" dot={{ r: 3, fill: "#0F6E56", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <div className="panel">
          <div className="panel-head">
            <h2>Product performance</h2>
            <span className="hint">By quantity sold</span>
          </div>
          <table>
            <thead>
              <tr><th style={{ width: "45%" }}>Item</th><th>Sold</th></tr>
            </thead>
            <tbody>
              {data.productPerformance.slice(0, 8).map((p, i) => (
                <tr key={p.name}>
                  <td style={{ display: "flex", alignItems: "center" }}>
                    <span className="rank">{i + 1}</span>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="thumb" style={{ marginRight: 10 }} />
                    ) : (
                      <div className="thumb thumb-fallback" style={{ marginRight: 10 }}>{p.name.charAt(0)}</div>
                    )}
                    {p.name}
                  </td>
                  <td>
                    <div className="qty-row">
                      <div className="qty-bar-track">
                        <div className="qty-bar-fill" style={{ width: `${(p.quantitySold / maxQty) * 100}%` }} />
                      </div>
                      <span className="qty-num mono">{p.quantitySold}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Vendors</h2>
            <span className="hint">{vendors.length} total</span>
          </div>
          <table>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id}>
                  <td>{v.businessName}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`badge ${STATUS_CLASS[v.status] || ""}`}>
                      <span className="badge-dot" />{v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
