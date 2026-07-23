import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const SEGMENT_CLASS = { "High Value": "badge-active", Regular: "badge-pending", New: "badge-suspended" };
const SEGMENT_COLOR = { "High Value": "#0F6E56", Regular: "#B5730B", New: "#A32D2D" };

export default function Insights() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState(null);

  const [segments, setSegments] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/analytics/customer-segments").then((r) => r.json()),
      fetch("/api/analytics/validate").then((r) => r.json())
    ]).then(([p, seg, val]) => {
      setProducts(p);
      setSegments(seg);
      setValidation(val);
      setLoading(false);
    });
  }, []);

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
            <div style={{ height: 160 }}>
              <ResponsiveContainer>
                <BarChart
                  layout="vertical"
                  data={[{ name: forecast.productName, "Current stock": forecast.currentStock, "Predicted need": forecast.predictedStock }]}
                  margin={{ left: 10 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--line)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Current stock" fill="#8B909A" radius={[0, 4, 4, 0]} barSize={22} />
                  <Bar dataKey="Predicted need" fill={forecast.restockNeeded ? "#A32D2D" : "#0F6E56"} radius={[0, 4, 4, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
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
