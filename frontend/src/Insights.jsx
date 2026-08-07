import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { exportAnalyticsPdf } from "./utils/exportPdf.js";

const SEGMENT_CLASS = { "High Value": "badge-active", Regular: "badge-pending", New: "badge-suspended" };
const SEGMENT_COLOR = { "High Value": "#0F6E56", Regular: "#B5730B", New: "#A32D2D" };
const FASTAPI_BASE = "http://localhost:8000";

export default function Insights() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState(null);

  const [segments, setSegments] = useState(null);
  const [validation, setValidation] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [ranking, setRanking] = useState(null);
  const [rankingError, setRankingError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/analytics/customer-segments").then((r) => r.json()),
      fetch("/api/analytics/validate").then((r) => r.json()),
      fetch("/api/transactions/analytics/baseline").then((r) => r.json()),
      fetch("/api/inventory/low-stock").then((r) => r.json())
    ]).then(([p, seg, val, base, low]) => {
      setProducts(p);
      setSegments(seg);
      setValidation(val);
      setBaseline(base);
      setLowStock(low);
      setLoading(false);
    });

    // Vendor benchmarking lives in the Python/FastAPI service (Milestone 3),
    // not the Node backend - fetched separately, with a clear message if
    // that service isn't running rather than a silent failure.
    fetch(`${FASTAPI_BASE}/vendors/ranking`)
      .then((r) => {
        if (!r.ok) throw new Error("Service returned an error");
        return r.json();
      })
      .then(setRanking)
      .catch(() => setRankingError("Can't reach the analytics service — start it with `uvicorn app.main:app --reload --port 8000` in analytics-service/"));
  }, []);

  // Simple rule-based suggestions, not a trained recommendation model -
  // combines top sellers, segment mix, and low-stock data already loaded
  // above into short, explainable action items.
  const buildSuggestions = () => {
    const suggestions = [];
    if (baseline?.productPerformance?.[0]) {
      suggestions.push(
        `"${baseline.productPerformance[0].name}" is your top seller this period — consider featuring it or bundling it with slower-moving items.`
      );
    }
    if (segments?.summary?.["High Value"]) {
      suggestions.push(
        `You have ${segments.summary["High Value"]} High Value customer${segments.summary["High Value"] > 1 ? "s" : ""} — a loyalty offer or early access to new products could improve retention.`
      );
    }
    if (segments?.summary?.["New"]) {
      suggestions.push(
        `${segments.summary["New"]} customer${segments.summary["New"] > 1 ? "s are" : " is"} still New — a first-order discount could turn them into Regulars.`
      );
    }
    if (lowStock.length > 0) {
      suggestions.push(
        `${lowStock.length} product${lowStock.length > 1 ? "s are" : " is"} running low on stock (${lowStock.slice(0, 2).map((l) => l.productId?.name).filter(Boolean).join(", ")}${lowStock.length > 2 ? ", ..." : ""}) — restock soon to avoid missed sales.`
      );
    }
    if (suggestions.length === 0) {
      suggestions.push("Not enough data yet for suggestions — seed the database or make a few purchases first.");
    }
    return suggestions;
  };

  const handleExportPdf = () => {
    exportAnalyticsPdf({
      title: "ShopSense Admin Analytics Report",
      subtitle: "Revenue, customer segments, and vendor performance",
      stats: [
        { label: "Total Revenue", value: `\u20b9${(baseline?.totalRevenue || 0).toLocaleString("en-IN")}` },
        { label: "Customers", value: segments?.customers?.length || 0 },
        { label: "High Value", value: segments?.summary?.["High Value"] || 0 }
      ],
      tables: [
        {
          heading: "Customer Segments",
          columns: ["Customer", "Orders", "Spent (\u20b9)", "Segment"],
          rows: (segments?.customers || []).map((c) => [c.customerId, c.orderCount, c.totalSpent.toLocaleString("en-IN"), c.segment])
        },
        {
          heading: "Vendor Benchmarking",
          columns: ["Rank", "Vendor", "Revenue (\u20b9)", "Orders", "Fulfillment %"],
          rows: (ranking || []).map((v) => [v.rank, v.businessName, v.revenue.toLocaleString("en-IN"), v.totalOrders, v.fulfillmentRate])
        }
      ]
    });
  };

  const runForecast = async () => {
    if (!selectedProduct) return;
    setForecastLoading(true);
    setForecastError(null);
    try {
      const res = await fetch(`/api/forecast?productId=${selectedProduct}&days=7`);
      const body = await res.json();
      if (!res.ok) {
        setForecastError(body.error || "Forecast failed");
      } else {
        setForecast(body);
      }
    } catch (err) {
      setForecastError(err.message);
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Insights</h1>
          <div className="sub">Inventory forecasting, customer segmentation &amp; data validation</div>
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

      {/* AI Suggestions */}
      <div className="panel">
        <div className="panel-head">
          <h2>AI Suggestions</h2>
          <span className="hint">Rule-based, not a trained model</span>
        </div>
        {loading ? (
          <div className="skeleton" style={{ height: 60 }} />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            {buildSuggestions().map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Vendor Benchmarking */}
      <div className="panel">
        <div className="panel-head">
          <h2>Vendor Benchmarking</h2>
          <span className="hint">From the analytics service</span>
        </div>
        {rankingError ? (
          <p style={{ color: "var(--ink-faint)", fontSize: 13 }}>{rankingError}</p>
        ) : !ranking ? (
          <div className="skeleton" style={{ height: 100 }} />
        ) : (
          <table>
            <thead>
              <tr><th>#</th><th>Vendor</th><th>Revenue</th><th>Orders</th><th>Fulfillment</th></tr>
            </thead>
            <tbody>
              {ranking.map((v) => (
                <tr key={v.vendorId}>
                  <td className="mono">{v.rank}</td>
                  <td>{v.businessName}</td>
                  <td className="mono">&#8377;{v.revenue.toLocaleString("en-IN")}</td>
                  <td className="mono">{v.totalOrders}</td>
                  <td className="mono">{v.fulfillmentRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inventory forecast */}
      <div className="panel">
        <div className="panel-head">
          <h2>Inventory forecast</h2>
          <span className="hint">7-day moving average</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 7, padding: "8px 10px", fontSize: 14 }}
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name} (stock: {p.stock})</option>
            ))}
          </select>
          <button
            onClick={runForecast}
            disabled={!selectedProduct || forecastLoading}
            style={{ background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            {forecastLoading ? "Calculating..." : "Run forecast"}
          </button>
        </div>

        {forecastError && (
          <div style={{ background: "var(--red-soft)", color: "var(--red)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
            {forecastError}
          </div>
        )}

        {forecast && (
          <>
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-label">Current stock</div>
                <div className="stat-value mono">{forecast.currentStock}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Predicted need (7d)</div>
                <div className="stat-value mono">{forecast.predictedStock}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Confidence</div>
                <div className="stat-value mono">{Math.round(forecast.confidenceLevel * 100)}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Restock needed?</div>
                <div className="stat-value" style={{ color: forecast.restockNeeded ? "var(--red)" : "var(--accent)" }}>
                  {forecast.restockNeeded ? "Yes" : "No"}
                </div>
              </div>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart
                  data={[
                    ...forecast.salesSeries.map((d) => ({
                      label: d.date.slice(5),
                      units: d.quantitySold,
                      type: "history"
                    })),
                    { label: "Next 7d avg/day", units: forecast.avgDailySales, type: "forecast" }
                  ]}
                  margin={{ left: -10 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.type === "forecast" ? "Predicted avg/day" : "Units sold"]} />
                  <Bar dataKey="units" radius={[4, 4, 0, 0]} barSize={26}>
                    {forecast.salesSeries.map((_, i) => (
                      <Cell key={i} fill="#8B909A" />
                    ))}
                    <Cell fill={forecast.restockNeeded ? "#A32D2D" : "#0F6E56"} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 8, textAlign: "center" }}>
              Grey bars = actual daily sales over the last {forecast.windowDays} days &middot; colored bar = predicted average for next week
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        {/* Customer segments */}
        <div className="panel">
          <div className="panel-head">
            <h2>Customer segments</h2>
            <span className="hint">By spend &amp; order count</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 140 }} />
          ) : segments.customers.length === 0 ? (
            <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>No customer transactions yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                <div style={{ width: 110, height: 110, flexShrink: 0 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={Object.entries(segments.summary).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={3}
                      >
                        {Object.keys(segments.summary).map((seg) => (
                          <Cell key={seg} fill={SEGMENT_COLOR[seg] || "#8B909A"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(segments.summary).map(([seg, count]) => (
                    <span key={seg} className={`badge ${SEGMENT_CLASS[seg] || ""}`} style={{ width: "fit-content" }}>
                      <span className="badge-dot" />{seg}: {count}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ height: Math.min(segments.customers.length, 5) * 34 + 20, marginBottom: 16 }}>
                <ResponsiveContainer>
                  <BarChart
                    layout="vertical"
                    data={segments.customers.slice(0, 5).map((c) => ({ name: c.customerId.split("@")[0], spent: c.totalSpent, segment: c.segment }))}
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid horizontal={false} stroke="var(--line)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={(v) => [`\u20b9${v.toLocaleString("en-IN")}`, "Total spent"]} />
                    <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={18}>
                      {segments.customers.slice(0, 5).map((c, i) => (
                        <Cell key={i} fill={SEGMENT_COLOR[c.segment] || "#8B909A"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table>
                <thead>
                  <tr><th>Customer</th><th>Orders</th><th>Spent</th><th>Segment</th></tr>
                </thead>
                <tbody>
                  {segments.customers.map((c) => (
                    <tr key={c.customerId}>
                      <td style={{ fontSize: 13 }}>{c.customerId}</td>
                      <td className="mono">{c.orderCount}</td>
                      <td className="mono">&#8377;{c.totalSpent.toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`badge ${SEGMENT_CLASS[c.segment] || ""}`}>
                          <span className="badge-dot" />{c.segment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Data validation */}
        <div className="panel">
          <div className="panel-head">
            <h2>Data validation</h2>
            <span className="hint">Raw vs. aggregated</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 140 }} />
          ) : (
            <>
              <div style={{
                background: validation.consistent ? "var(--accent-soft)" : "var(--red-soft)",
                color: validation.consistent ? "var(--accent)" : "var(--red)",
                borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 600, marginBottom: 16
              }}>
                {validation.consistent ? "✓ Fully consistent" : "⚠ Mismatch detected"}
              </div>
              <table>
                <tbody>
                  <tr><td>Transactions checked</td><td className="mono" style={{ textAlign: "right" }}>{validation.transactionCount}</td></tr>
                  <tr><td>Raw revenue total</td><td className="mono" style={{ textAlign: "right" }}>&#8377;{validation.rawRevenueTotal.toLocaleString("en-IN")}</td></tr>
                  <tr><td>Aggregated revenue total</td><td className="mono" style={{ textAlign: "right" }}>&#8377;{validation.aggregatedRevenueTotal.toLocaleString("en-IN")}</td></tr>
                  <tr><td>Raw units total</td><td className="mono" style={{ textAlign: "right" }}>{validation.rawUnitsTotal}</td></tr>
                  <tr><td>Aggregated units total</td><td className="mono" style={{ textAlign: "right" }}>{validation.aggregatedUnitsTotal}</td></tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
