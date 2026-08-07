"""
ShopSense BI Dashboard prototype (Milestone 3, Step 5).

Run with the FastAPI service already running on port 8000:
    streamlit run bi_dashboard/dashboard.py
"""

import streamlit as st
import pandas as pd
import requests

API_BASE = "http://localhost:8000"

st.set_page_config(page_title="ShopSense BI Dashboard", layout="wide")
st.title("ShopSense BI Dashboard")
st.caption("Milestone 3 prototype - reads live from the FastAPI analytics service")

# --- Revenue & margin ---
st.header("Revenue & Marketplace Margin by Vendor")
try:
    revenue_data = requests.get(f"{API_BASE}/analytics/revenue", timeout=5).json()
    if revenue_data:
        df = pd.DataFrame(revenue_data)
        col1, col2 = st.columns(2)
        with col1:
            st.bar_chart(df.set_index("businessName")["gmv"])
            st.caption("GMV (Gross Merchandise Value) per vendor")
        with col2:
            st.bar_chart(df.set_index("businessName")["marketplaceMargin"])
            st.caption("Marketplace margin (commission earned) per vendor")

        st.dataframe(df, use_container_width=True)
        st.download_button(
            "Export revenue report (CSV)",
            df.to_csv(index=False),
            file_name="shopsense_revenue_report.csv",
            mime="text/csv",
        )
    else:
        st.info("No completed transactions yet - seed and buy something first.")
except requests.exceptions.RequestException:
    st.error("Can't reach the FastAPI service. Start it with: uvicorn app.main:app --reload --port 8000")
    st.stop()

# --- Vendor ranking ---
st.header("Vendor Benchmarking")
ranking_data = requests.get(f"{API_BASE}/vendors/ranking", timeout=5).json()
if ranking_data:
    rank_df = pd.DataFrame(ranking_data)
    st.dataframe(rank_df, use_container_width=True)
    st.download_button(
        "Export vendor ranking (CSV)",
        rank_df.to_csv(index=False),
        file_name="shopsense_vendor_ranking.csv",
        mime="text/csv",
    )

# --- Category performance ---
st.header("Category Performance")
category_data = requests.get(f"{API_BASE}/products/category-performance", timeout=5).json()
if category_data:
    cat_df = pd.DataFrame(category_data)
    st.bar_chart(cat_df.set_index("category")["revenue"])

# --- Growth trend ---
st.header("Growth Trend (period-over-period)")
growth_data = requests.get(f"{API_BASE}/analytics/growth", timeout=5).json()
if growth_data:
    c1, c2, c3 = st.columns(3)
    c1.metric("First half revenue", f"₹{growth_data['firstHalfRevenue']:,.0f}")
    c2.metric("Second half revenue", f"₹{growth_data['secondHalfRevenue']:,.0f}")
    c3.metric(
        "Growth",
        f"{growth_data['growthPercent']}%" if growth_data["growthPercent"] is not None else "N/A",
        delta=growth_data["trend"],
    )

# --- ML forecast lookup ---
st.header("ML-Based Inventory Forecast")
st.caption("Requires models trained via: python -m app.ml.train_forecast")
product_id_input = st.text_input("Enter a Product ID to look up its trained forecast")
if product_id_input:
    resp = requests.get(f"{API_BASE}/ml-forecast/{product_id_input}", timeout=5)
    if resp.status_code == 200:
        st.json(resp.json())
    else:
        st.warning(resp.json().get("detail", "No forecast found for that product ID"))
