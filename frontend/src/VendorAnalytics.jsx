import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { exportAnalyticsPdf } from "./utils/exportPdf.js";

const FASTAPI_BASE = "http://localhost:8000";

export default function VendorAnalytics() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [revenueData, setRevenueData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((v) => {
        setVendors(v);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Vendor role isn't tied to one real vendor account yet (no per-vendor
    // login), so this uses a vendor picker instead of auto-scoping - an
    // honest simplification worth mentioning if asked.
    Promise.all([
      fetch(`${FASTAPI_BASE}/analytics/revenue`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${FASTAPI_BASE}/products/category-performance`).then((r) => (r.ok ? r.json() : []))
    ])
      .then(([rev, cat]) => {
        setRevenueData(rev);
        setCategoryData(cat);
      })
      .catch(() => setError("Can't reach the analytics service — start it with `uvicorn app.main:app --reload --port 8000` in analytics-service/"));
  }, []);

  const myRow = revenueData?.find((r) => r.vendorId === selectedVendor);

  const handleExportPdf = () => {
    exportAnalyticsPdf({
      title: "ShopSense Vendor Analytics Report",
      subtitle: myRow ? `${myRow.businessName}` : "Select a vendor first",
      stats: myRow
        ? [
            { label: "GMV", value: `\u20b9${myRow.gmv.toLocaleString("en-IN")}` },
            { label: "Orders", value: myRow.orders },
            { label: "Avg Order Value", value: `\u20b9${myRow.avgOrderValue.toLocaleString("en-IN")}` }
          ]
        : [],
      tables: [
        {
          heading: "Category Performance (marketplace-wide)",
          columns: ["Category", "Units Sold", "Revenue (\u20b9)"],
          rows: (categoryData || []).map((c) => [c.category, c.unitsSold, c.revenue.toLocaleString("en-IN")])
        }
      ]
    });
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Analytics</h1>
          <div className="sub">Your revenue and category performance</div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={!myRow}
          style={{
            background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: myRow ? "pointer" : "not-allowed",
            opacity: myRow ? 1 : 0.5
          }}
        >
          Export as PDF
        </button>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>View as vendor</h2>
          <span className="hint">No per-vendor login yet — pick one to view</span>
        </div>
        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "8px 10px", fontSize: 14, width: "100%", maxWidth: 320 }}
        >
          <option value="">Select your business...</option>
          {vendors.map((v) => (
            <option key={v._id} value={v._id}>{v.businessName}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="panel">
          <p style={{ color: "var(--ink-faint)", fontSize: 13 }}>{error}</p>
        </div>
      )}

      {myRow && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">GMV</div>
            <div className="stat-value mono">&#8377;{myRow.gmv.toLocaleString("en-IN")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Orders</div>
            <div className="stat-value mono">{myRow.orders}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg order value</div>
            <div className="stat-value mono">&#8377;{myRow.avgOrderValue.toLocaleString("en-IN")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Commission rate</div>
            <div className="stat-value mono">{myRow.commissionRate}%</div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <h2>Category performance</h2>
          <span className="hint">Marketplace-wide, for context</span>
        </div>
        {!categoryData ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={categoryData} margin={{ left: -10 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#0F6E56" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
