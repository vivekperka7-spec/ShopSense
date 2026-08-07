import React, { useState } from "react";
import Landing from "./Landing.jsx";
import Dashboard from "./Dashboard.jsx";
import Vendors from "./Vendors.jsx";
import Products from "./Products.jsx";
import Wishlist from "./Wishlist.jsx";
import Insights from "./Insights.jsx";
import Cart from "./Cart.jsx";
import Orders from "./Orders.jsx";
import VendorAnalytics from "./VendorAnalytics.jsx";
import CustomerAnalytics from "./CustomerAnalytics.jsx";
import Logo from "./Logo.jsx";

const NAV_BY_ROLE = {
  Admin: ["Dashboard", "Vendors", "Products", "Insights", "Transactions"],
  Vendor: ["Dashboard", "Products", "Analytics"],
  Customer: ["Shop", "Cart", "Orders", "Wishlist", "My Spending"]
};

const DEFAULT_PAGE = {
  Admin: "Dashboard",
  Vendor: "Dashboard",
  Customer: "Shop"
};

export default function App() {
  const [session, setSession] = useState(null); // { role, email }
  const [page, setPage] = useState(null);
  const [cart, setCart] = useState([]); // [{ product, quantity }]

  const handleEnter = (role, email) => {
    setSession({ role, email: email || "guest@shopsense.dev" });
    setPage(DEFAULT_PAGE[role]);
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id);
      if (existing) {
        return prev.map((c) =>
          c.product._id === product._id
            ? { ...c, quantity: Math.min(c.quantity + quantity, product.stock) }
            : c
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((c) => c.product._id !== productId)
        : prev.map((c) => (c.product._id === productId ? { ...c, quantity } : c))
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((c) => c.product._id !== productId));
  };

  const clearCart = () => setCart([]);

  if (!session) {
    return <Landing onEnter={handleEnter} />;
  }

  const { role, email } = session;
  const nav = NAV_BY_ROLE[role];
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={28} />
          <div className="brand-name">ShopSense</div>
        </div>
        <div style={{ margin: "-16px 0 8px 4px" }}>
          <span className="role-badge">{role}</span>
        </div>
        <nav className="nav">
          {nav.map((item) => (
            <div
              key={item}
              className={`nav-item ${item === page ? "active" : ""}`}
              onClick={() => setPage(item)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span><span className="nav-dot" />{item}</span>
              {item === "Cart" && cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </div>
          ))}
        </nav>
        <div
          className="nav-item"
          style={{ marginTop: "auto", opacity: 0.6 }}
          onClick={() => setSession(null)}
        >
          <span className="nav-dot" />
          Sign out
        </div>
      </aside>
      <main className="main">
        {page === "Dashboard" && <Dashboard />}
        {page === "Vendors" && role === "Admin" && <Vendors />}
        {page === "Products" && (role === "Admin" || role === "Vendor") && <Products role={role} />}
        {page === "Analytics" && role === "Vendor" && <VendorAnalytics />}
        {page === "Insights" && role === "Admin" && <Insights />}
        {page === "Shop" && role === "Customer" && (
          <Products role={role} customerId={email} onAddToCart={addToCart} />
        )}
        {page === "Cart" && role === "Customer" && (
          <Cart
            cart={cart}
            customerId={email}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onOrderPlaced={() => { clearCart(); setPage("Orders"); }}
          />
        )}
        {page === "Orders" && role === "Customer" && <Orders customerId={email} />}
        {page === "Wishlist" && role === "Customer" && <Wishlist customerId={email} />}
        {page === "My Spending" && role === "Customer" && <CustomerAnalytics customerId={email} />}
        {page === "Transactions" && role === "Admin" && (
          <div className="panel">
            <div className="panel-head"><h2>Transactions</h2></div>
            <p style={{ color: "var(--ink-faint)", fontSize: 14 }}>Coming in a later milestone.</p>
          </div>
        )}
      </main>
    </div>
  );
}
