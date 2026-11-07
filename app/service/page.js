"use client";
import { useState, useEffect } from "react";
import JobsTab from "./tabs/JobsTab";
import BookingsTab from "./tabs/BookingsTab";
import CatalogTab from "./tabs/CatalogTab";

const TABS = [
  { id: "jobs", label: "🔧 Repair Jobs" },
  { id: "bookings", label: "📥 Bookings" },
  { id: "catalog", label: "🛠️ Service Catalog" },
];

export default function ServicePage() {
  const [activeTab, setActiveTab] = useState("jobs");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab && TABS.some((t) => t.id === urlTab)) setActiveTab(urlTab);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">🔧 Service Center</h1>
        <p className="text-xs text-gray-500 mt-0.5">Repair jobs, customer bookings සහ services</p>
      </div>

      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${activeTab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "jobs" && <JobsTab />}
      {activeTab === "bookings" && <BookingsTab />}
      {activeTab === "catalog" && <CatalogTab />}
    </div>
  );
}