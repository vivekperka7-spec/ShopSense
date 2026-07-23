import React, { useEffect, useState } from "react";

export default function Wishlist({ customerId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/wishlist/${encodeURIComponent(customerId)}`)
      .then((r) => r.json())
      .then((w) => { setItems(w.productIds || []); setLoading(false); });
  };

  useEffect(load, [customerId]);

  const remove = async (productId) => {
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, productId })
    });
    setItems((prev) => prev.filter((p) => p._id !== productId));
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Wishlist</h1>
          <div className="sub">Saved for {customerId}</div>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : items.length === 0 ? (
          <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>No saved items yet — heart a product in Shop to add it here.</p>
        ) : (
          <table>
            <thead>
              <tr><th></th><th>Product</th><th>Price</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td style={{ width: 44 }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="thumb" />
                    ) : (
                      <div className="thumb thumb-fallback">{p.name.charAt(0)}</div>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td className="mono">&#8377;{p.price?.toLocaleString("en-IN")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => remove(p._id)}
                      style={{ background: "none", border: "none", color: "var(--red)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
