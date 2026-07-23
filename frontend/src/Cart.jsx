import React, { useState } from "react";

export default function Cart({ cart, customerId, onUpdateQuantity, onRemove, onOrderPlaced }) {
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

  const handleCheckout = async () => {
    setCheckingOut(true);
    setError(null);
    try {
      // Place one transaction per line item, sequentially, so a failure partway
      // through (e.g. stock changed) surfaces exactly which item failed.
      for (const item of cart) {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: item.product.vendorId?._id || item.product.vendorId,
            productId: item.product._id,
            customerId,
            quantity: item.quantity,
            unitPrice: item.product.price
          })
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(`${item.product.name}: ${body.error || "purchase failed"}`);
        }
      }
      onOrderPlaced();
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Cart</h1>
          <div className="sub">{cart.length} item{cart.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="panel">
          <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>Your cart is empty — add something from the Shop.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }}>
          <div className="panel">
            {cart.map((item) => (
              <div key={item.product._id} className="cart-row">
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.name} className="thumb" style={{ width: 48, height: 48 }} />
                ) : (
                  <div className="thumb thumb-fallback" style={{ width: 48, height: 48 }}>{item.product.name.charAt(0)}</div>
                )}
                <div className="cart-row-info">
                  <div className="cart-row-name">{item.product.name}</div>
                  <div className="cart-row-vendor">{item.product.vendorId?.businessName || "—"}</div>
                </div>
                <div className="qty-stepper">
                  <button onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}>&minus;</button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                  >
                    +
                  </button>
                </div>
                <div className="mono" style={{ width: 90, textAlign: "right", fontWeight: 600 }}>
                  &#8377;{(item.product.price * item.quantity).toLocaleString("en-IN")}
                </div>
                <button
                  onClick={() => onRemove(item.product._id)}
                  style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Order summary</h2>
            </div>
            <div className="cart-summary-row">
              <span>Items</span>
              <span className="mono">{cart.reduce((sum, c) => sum + c.quantity, 0)}</span>
            </div>
            <div className="cart-summary-total">
              <span>Total</span>
              <span className="mono">&#8377;{total.toLocaleString("en-IN")}</span>
            </div>

            {error && (
              <div style={{ background: "var(--red-soft)", color: "var(--red)", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginTop: 14 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              style={{
                width: "100%", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8,
                padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16
              }}
            >
              {checkingOut ? "Placing order..." : "Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
