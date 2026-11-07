"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmtRs } from "@/lib/utils";

export default function ReportsPage() {
  const [range, setRange] = useState("today");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  useEffect(() => {
    loadData();
  }, [range]);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    let fromDate = new Date();
    if (range === "today") fromDate.setHours(0, 0, 0, 0);
    else if (range === "7d") fromDate.setDate(now.getDate() - 7);
    else if (range === "30d") fromDate.setDate(now.getDate() - 30);
    else if (range === "month") fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const fromIso = fromDate.toISOString();

    const [salesRes, jobsRes] = await Promise.all([
      supabase.from("sales").select("id, grand_total, sale_items(cost_price, qty)").gte("sale_date", fromIso),
      supabase.from("service_jobs").select("id, final_total, service_charge, parts_total").eq("status", "Delivered").gte("delivered_date", fromIso)
    ]);

    setSales(salesRes.data || []);
    setJobs(jobsRes.data || []);
    setLoading(false);
  }

  // 🧮 Calculations
  const totalSales = sales.reduce((sum, s) => sum + Number(s.grand_total || 0), 0);
  const totalJobs = jobs.reduce((sum, j) => sum + Number(j.final_total || 0), 0);
  const totalRevenue = totalSales + totalJobs;

  // Profit calculation (Sale Price - Cost Price)
  let totalProfit = 0;
  sales.forEach(s => {
    (s.sale_items || []).forEach(item => {
      const cost = Number(item.cost_price || 0);
      const sell = Number(item.unit_price || 0);
      totalProfit += (sell - cost) * Number(item.qty || 0);
    });
  });
  // Job Profit (Simplified: Service charge is pure profit, Parts profit = (Sell - Cost))
  jobs.forEach(j => {
    totalProfit += Number(j.service_charge || 0); // Assuming parts cost is handled elsewhere for simplicity, or add parts profit if data exists
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">📈 Reports</h1>
          <p className="text-xs text-gray-500 mt-1">ආදායම සහ ලාභය විශ්ලේෂණය කරන්න</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/services" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">🔧 Service Reports</Link>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { k: "today", l: "Today" }, { k: "7d", l: "Last 7 Days" }, 
          { k: "30d", l: "Last 30 Days" }, { k: "month", l: "This Month" }
        ].map(r => (
          <button key={r.k} onClick={() => setRange(r.k)} className={`px-4 py-1.5 rounded text-sm font-medium transition ${range === r.k ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>{r.l}</button>
        ))}
      </div>

      {loading ? <p className="text-center text-gray-500 py-6">Loading...</p> : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">💵 Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-green-400">{fmtRs(totalRevenue)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">📈 Est. Profit</p>
              <p className="text-xl md:text-2xl font-bold text-blue-400">{fmtRs(totalProfit)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">🛒 Product Sales</p>
              <p className="text-xl md:text-2xl font-bold text-white">{fmtRs(totalSales)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">🔧 Service Revenue</p>
              <p className="text-xl md:text-2xl font-bold text-white">{fmtRs(totalJobs)}</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center">
            <p className="text-gray-400 mb-2">Detailed reports coming soon...</p>
            <p className="text-xs text-gray-500">ඔයාට Top Selling Products, Daily Breakdown වගේ දේවල් මෙතනට එකතු කරගන්න පුළුවන්.</p>
          </div>
        </>
      )}
    </div>
  );
}