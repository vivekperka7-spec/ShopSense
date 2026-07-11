import React, { useEffect, useState } from "react";

const EMPTY_FORM = { vendorId: "", name: "", category: "", price: "", stock: "", imageUrl: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = () => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/vendors").then((r) => r.json())
    ]).then(([p, v]) => { setProducts(p); setVendors(v); setLoading(false); });
  };

  useEffect(loadAll, []);

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
