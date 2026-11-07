"use client";
import { useState, useEffect } from "react";
import QuotationsTab from "./tabs/QuotationsTab";
import OrdersTab from "./tabs/OrdersTab";
import BuildsTab from "./tabs/BuildsTab";

const TABS = [
  { id: "orders", label: "🛒 Store Orders" },
  { id: "quotations", label: "📄 Quotations" },
  { id: "builds", label: "🖥️ PC Builds" },
];

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab && TABS.some((t) => t.id === urlTab)) setActiveTab(urlTab);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Sales</h1>
        <p className="text-xs text-gray-500 mt-0.5">Store Orders, Quotations, සහ PC Builds</p>
      </div>

      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id} onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${activeTab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "quotations" && <QuotationsTab />}
      {activeTab === "builds" && <BuildsTab />}
    </div>
  );
}