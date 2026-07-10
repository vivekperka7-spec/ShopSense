import React, { useState } from "react";
import Dashboard from "./Dashboard.jsx";
import Vendors from "./Vendors.jsx";
import Products from "./Products.jsx";

const NAV = ["Dashboard", "Vendors", "Products", "Transactions"];

export default function App() {
  const [page, setPage] = useState("Dashboard");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SS</div>
          <div className="brand-name">ShopSense</div>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <div
              key={item}
              className={`nav-item ${item === page ? "active" : ""}`}
              onClick={() => setPage(item)}
            >
              <span className="nav-dot" />
              {item}
            </div>
          ))}
        </nav>
      </aside>
      <main className="main">
        {page === "Dashboard" && <Dashboard />}
        {page === "Vendors" && <Vendors />}
        {page === "Products" && <Products />}
        {page === "Transactions" && (
          <div className="panel">
            <div className="panel-head"><h2>Transactions</h2></div>
            <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>Coming in a later milestone.</p>
          </div>
        )}
      </main>
    </div>
  );
}
