import React, { useEffect, useState } from "react";

const STATUS_CLASS = { Active: "badge-active", Pending: "badge-pending", Suspended: "badge-suspended" };
const EMPTY_FORM = { businessName: "", contactEmail: "", phone: "", category: "" };

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const loadVendors = () => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((v) => { setVendors(v); setLoading(false); });
  };

  useEffect(loadVendors, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const startEdit = (v) => {
    setEditingId(v._id);
    setErrors([]);
    setJustAdded(null);
    setForm({
      businessName: v.businessName,
      contactEmail: v.contactEmail,
      phone: v.phone || "",
      category: v.category || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setJustAdded(null);
    try {
      const isEdit = Boolean(editingId);
      const res = await fetch(isEdit ? `/api/vendors/${editingId}` : "/api/vendors", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await res.json();
      if (!res.ok) {
        setErrors(body.details || [body.error || "Request failed"]);
      } else {
        setJustAdded(isEdit ? `${body.businessName} updated` : `${body.businessName} registered — status: Pending`);
        setForm(EMPTY_FORM);
        setEditingId(null);
        loadVendors();
      }
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`/api/vendors/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    loadVendors();
  };

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Vendors</h1>
          <div className="sub">Onboarding &amp; marketplace management</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 24, alignItems: "start" }}>
        <div className="panel">
          <div className="panel-head">
            <h2>{editingId ? "Edit vendor" : "Register a vendor"}</h2>
            <span className="hint">{editingId ? "Editing existing" : "Validated on submit"}</span>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Business name" value={form.businessName} onChange={handleChange("businessName")} required />
            <Field label="Contact email" type="email" value={form.contactEmail} onChange={handleChange("contactEmail")} required />
            <Field label="Phone" value={form.phone} onChange={handleChange("phone")} />
            <Field label="Category" value={form.category} onChange={handleChange("category")} placeholder="Electronics, Fashion..." />

            {errors.length > 0 && (
              <div style={{ background: "var(--red-soft)", color: "var(--red)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
                {errors.map((e, i) => <div key={i}>&middot; {e}</div>)}
              </div>
            )}
            {justAdded && (
              <div style={{ background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
                {justAdded}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={submitting} style={{
                background: "var(--navy)", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 4
              }}>
                {submitting ? "Saving..." : editingId ? "Save changes" : "Register vendor"}
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
            <h2>All vendors</h2>
            <span className="hint">{vendors.length} total</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : (
            <table>
              <thead>
                <tr><th>Vendor</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{v.businessName}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{v.contactEmail}</div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[v.status] || ""}`}>
                        <span className="badge-dot" />{v.status}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => startEdit(v)} style={linkBtnStyle}>Edit</button>
                      {v.status !== "Active" && (
                        <button onClick={() => updateStatus(v._id, "Active")} style={linkBtnStyle}>Approve</button>
                      )}
                      {v.status !== "Suspended" && (
                        <button onClick={() => updateStatus(v._id, "Suspended")} style={{ ...linkBtnStyle, color: "var(--red)" }}>Suspend</button>
                      )}
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

function Field({ label, type = "text", value, onChange, required, placeholder }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--ink-soft)" }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={{
          border: "1px solid var(--line)", borderRadius: 7, padding: "8px 10px",
          fontSize: 14, fontFamily: "var(--font-ui)", color: "var(--ink)"
        }}
      />
    </label>
  );
}

const linkBtnStyle = {
  background: "none", border: "none", color: "var(--accent)", fontSize: 13,
  fontWeight: 500, cursor: "pointer", padding: "4px 8px", marginRight: 4
};
