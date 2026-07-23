import React, { useState } from "react";
import Logo from "./Logo.jsx";

const ROLES = ["Admin", "Vendor", "Customer"];

export default function Landing({ onEnter }) {
  const [role, setRole] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // No auth backend yet - this picks which view to show, it doesn't check
    // credentials or tie a role to a real account.
    onEnter(role, email);
  };

  return (
    <div className="landing-centered">
      <div className="landing-brand-center">
        <Logo size={44} />
        <div className="landing-brand-name">ShopSense</div>
        <div className="landing-brand-tag">Marketplace Vision, Simplified</div>
      </div>

      <div className="landing-card">
        <h2>Welcome back</h2>
        <div className="sub">Sign in to continue to ShopSense</div>

        <div className="role-tabs">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={`role-tab ${role === r ? "active" : ""}`}
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="landing-field">
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="landing-field">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="landing-submit">Sign in as {role} &rarr;</button>
        </form>
        <div className="landing-footer">
          New to ShopSense? <a onClick={() => onEnter(role, email)}>Continue as guest</a>
        </div>
      </div>
    </div>
  );
}
