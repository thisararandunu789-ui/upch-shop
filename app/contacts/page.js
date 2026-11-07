"use client";

import { useState, useEffect } from "react";
import ContactsTab from "./ContactsTab";

const TABS = [
  { id: "customers", label: "👤 Customers" },
  { id: "suppliers", label: "🏢 Suppliers" },
];

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState("customers");

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
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Contacts</h1>
        <p className="text-xs text-gray-500 mt-0.5">Customers සහ Suppliers — එකම තැනකින් manage කරන්න</p>
      </div>

      <div className="flex gap-2 border-b border-gray-700 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              activeTab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "customers" && <ContactsTab type="customers" />}
      {activeTab === "suppliers" && <ContactsTab type="suppliers" />}
    </div>
  );
}