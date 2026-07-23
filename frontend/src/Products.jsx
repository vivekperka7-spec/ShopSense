import React, { useEffect, useState } from "react";

const EMPTY_FORM = { vendorId: "", name: "", category: "", price: "", stock: "", imageUrl: "" };

function StoreCard({ product, inWishlist, onToggleWishlist, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock < 1;

  const handleAdd = () => {
    onAddToCart(product, qty);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="store-card">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} />
      ) : (
        <div className="store-fallback">{product.name.charAt(0)}</div>
      )}
      <div className="store-card-body">
        <div className="store-card-name">{product.name}</div>
        <div className="store-card-vendor">{product.vendorId?.businessName || "—"}</div>
        <div className="store-card-footer">
          <span className="store-card-price mono">&#8377;{product.price.toLocaleString("en-IN")}</span>
          <button className={`store-icon-btn ${inWishlist ? "active" : ""}`} onClick={() => onToggleWishlist(product)} title="Wishlist">
            {inWishlist ? "\u2665" : "\u2661"}
          </button>
        </div>
        {!outOfStock ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 8 }}>
            <div className="qty-stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>&minus;</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock}>+</button>
            </div>
            <button
              onClick={handleAdd}
              style={{
                flex: 1, border: "none", borderRadius: 6, padding: "6px 0", fontSize: 12, fontWeight: 600,
                color: "#fff", background: added ? "var(--navy)" : "var(--accent)", cursor: "pointer"
              }}
            >
              {added ? "Added \u2713" : "Add to cart"}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-faint)", textAlign: "center" }}>Out of stock</div>
        )}
      </div>
    </div>
  );
}

export default function Products({ role = "Admin", customerId, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [buyingId, setBuyingId] = useState(null);
  const [buyMessage, setBuyMessage] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const loadAll = () => {
    const calls = [
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/vendors").then((r) => r.json())
    ];
    Promise.all(calls).then(([p, v]) => { setProducts(p); setVendors(v); setLoading(false); });

    if (role === "Customer" && customerId) {
      fetch(`/api/wishlist/${encodeURIComponent(customerId)}`)
        .then((r) => r.json())
        .then((w) => setWishlistIds((w.productIds || []).map((id) => (id._id ? id._id : id))));

      fetch(`/api/recommendations/${encodeURIComponent(customerId)}`)
        .then((r) => r.json())
        .then((rec) => setRecommendations(rec.recommendations || []));
    }
  };

  useEffect(loadAll, [role, customerId]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const startEdit = (p) => {
    setEditingId(p._id);
    setError(null);
    setForm({
      vendorId: p.vendorId?._id || p.vendorId,
      name: p.name,
      category: p.category || "",
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl || ""
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); setError(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const isEdit = Boolean(editingId);
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      const res = await fetch(isEdit ? `/api/products/${editingId}` : "/api/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Request failed");
      } else {
        setForm(EMPTY_FORM);
        setEditingId(null);
        loadAll();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadAll();
  };

  // Admin/Vendor quick-buy (unchanged) - Customer role now uses cart flow instead
  const handleBuy = async (product) => {
    setBuyingId(product._id);
    setBuyMessage(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: product.vendorId?._id || product.vendorId,
          productId: product._id,
          quantity: 1,
          unitPrice: product.price
        })
      });
      const body = await res.json();
      if (!res.ok) {
        setBuyMessage({ type: "error", text: body.error || "Purchase failed" });
      } else {
        setBuyMessage({ type: "success", text: `Purchased 1x ${product.name}` });
        loadAll();
      }
    } catch (err) {
      setBuyMessage({ type: "error", text: err.message });
    } finally {
      setBuyingId(null);
    }
  };

  const toggleWishlist = async (product) => {
    const inWishlist = wishlistIds.includes(product._id);
    await fetch("/api/wishlist", {
      method: inWishlist ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, productId: product._id })
    });
    setWishlistIds((prev) =>
      inWishlist ? prev.filter((id) => id !== product._id) : [...prev, product._id]
    );
  };

  // ---- Customer view: storefront grid with quantity + add-to-cart ----
  if (role === "Customer") {
    return (
      <div>
        <div className="topbar">
          <div>
            <h1>Shop</h1>
            <div className="sub">Browse products across all vendors</div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div className="panel-head" style={{ marginBottom: 12 }}>
              <h2>Recommended for you</h2>
              <span className="hint">Based on your past purchases</span>
            </div>
            <div className="storefront-grid">
              {recommendations.map((p) => (
                <StoreCard
                  key={p._id}
                  product={p}
                  inWishlist={wishlistIds.includes(p._id)}
                  onToggleWishlist={toggleWishlist}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : (
          <>
            {recommendations.length > 0 && (
              <div className="panel-head" style={{ marginBottom: 12 }}>
                <h2>All products</h2>
              </div>
            )}
            <div className="storefront-grid">
              {products.map((p) => (
                <StoreCard
                  key={p._id}
                  product={p}
                  inWishlist={wishlistIds.includes(p._id)}
                  onToggleWishlist={toggleWishlist}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- Admin / Vendor view: full catalog management ----
  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Products</h1>
          <div className="sub">Catalog across all vendors</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 24, alignItems: "start" }}>
        <div className="panel">
          <div className="panel-head">
            <h2>{editingId ? "Edit product" : "Add a product"}</h2>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={labelStyle}>
              Vendor
              <select value={form.vendorId} onChange={handleChange("vendorId")} required style={inputStyle}>
                <option value="" disabled>Select vendor</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>{v.businessName}</option>
                ))}
              </select>
            </label>
            <Field label="Product name" value={form.name} onChange={handleChange("name")} required />
            <Field label="Category" value={form.category} onChange={handleChange("category")} />
            <Field label="Price (\u20b9)" type="number" value={form.price} onChange={handleChange("price")} required />
            <Field label="Stock" type="number" value={form.stock} onChange={handleChange("stock")} required />
            <Field label="Image URL" value={form.imageUrl} onChange={handleChange("imageUrl")} placeholder="https://..." />

            {error && (
              <div style={{ background: "var(--red-soft)", color: "var(--red)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={submitting} style={{
                background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 4
              }}>
                {submitting ? "Saving..." : editingId ? "Save changes" : "Add product"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={{
                  background: "none", color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: 8,
                  padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 4
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Catalog</h2>
            <span className="hint">{products.length} products</span>
          </div>
          {buyMessage && (
            <div style={{
              background: buyMessage.type === "success" ? "var(--accent-soft)" : "var(--red-soft)",
              color: buyMessage.type === "success" ? "var(--accent)" : "var(--red)",
              borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 14
            }}>
              {buyMessage.text}
            </div>
          )}
          {loading ? (
            <div className="skeleton" style={{ height: 160 }} />
          ) : (
            <table>
              <thead>
                <tr><th></th><th>Product</th><th>Vendor</th><th>Price</th><th>Stock</th><th></th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td style={{ width: 44 }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="thumb" />
                      ) : (
                        <div className="thumb thumb-fallback">{p.name.charAt(0)}</div>
                      )}
                    </td>
                    <td>{p.name}</td>
                    <td style={{ color: "var(--ink-faint)" }}>{p.vendorId?.businessName || "—"}</td>
                    <td className="mono">&#8377;{p.price.toLocaleString("en-IN")}</td>
                    <td className="mono">{p.stock}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleBuy(p)}
                        disabled={p.stock < 1 || buyingId === p._id}
                        style={{
                          ...linkBtnStyle,
                          color: p.stock < 1 ? "var(--ink-faint)" : "#fff",
                          background: p.stock < 1 ? "var(--bg)" : "var(--accent)",
                          borderRadius: 6, fontWeight: 600, cursor: p.stock < 1 ? "not-allowed" : "pointer"
                        }}
                      >
                        {p.stock < 1 ? "Out of stock" : buyingId === p._id ? "Buying..." : "Buy"}
                      </button>
                      <button onClick={() => startEdit(p)} style={linkBtnStyle}>Edit</button>
                      <button onClick={() => handleDelete(p._id)} style={{ ...linkBtnStyle, color: "var(--red)" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, required }) {
  return (
    <label style={labelStyle}>
      {label}
      <input type={type} value={value} onChange={onChange} required={required} style={inputStyle} />
    </label>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--ink-soft)" };
const inputStyle = { border: "1px solid var(--line)", borderRadius: 7, padding: "8px 10px", fontSize: 14, fontFamily: "var(--font-ui)", color: "var(--ink)" };
const linkBtnStyle = { background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "4px 8px", marginRight: 4 };
