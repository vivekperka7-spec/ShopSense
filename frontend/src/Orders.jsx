import React, { useEffect, useState } from "react";

const STATUS_STYLE = {
  Completed: { background: "var(--accent-soft)", color: "var(--accent)" },
  Refunded: { background: "var(--red-soft)", color: "var(--red)" },
  Pending: { background: "var(--amber-soft)", color: "var(--amber)" }
};

export default function Orders({ customerId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transactions?customerId=${encodeURIComponent(customerId)}`)
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false); });
  }, [customerId]);

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Orders</h1>
          <div className="sub">Your purchase history</div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : orders.length === 0 ? (
        <div className="panel">
          <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>No orders yet — head to Shop to buy something.</p>
        </div>
      ) : (
        orders.map((o) => (
          <div key={o._id} className="order-card">
            <div className="order-card-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {o.productId?.imageUrl ? (
                  <img src={o.productId.imageUrl} alt={o.productId?.name} className="thumb" />
                ) : (
                  <div className="thumb thumb-fallback">{(o.productId?.name || "?").charAt(0)}</div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{o.productId?.name || "Product removed"}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{o.vendorId?.businessName || "—"}</div>
                </div>
              </div>
              <span className="order-status" style={STATUS_STYLE[o.status] || {}}>{o.status}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-soft)" }}>
              <span>Qty: {o.quantity} &times; &#8377;{o.unitPrice.toLocaleString("en-IN")}</span>
              <span className="mono" style={{ fontWeight: 600, color: "var(--ink)" }}>&#8377;{o.totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 6 }}>
              {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
