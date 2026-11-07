"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmtRs, fmtDate } from "@/lib/utils";

export default function WarrantyPage() {
  const [claims, setClaims] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | pending | resolved | expiring
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const [cRes, eRes] = await Promise.all([
        supabase.from("warranty_claims").select("*").order("claim_date", { ascending: false }),
        supabase.from("v_warranty_expiring").select("*").order("days_remaining", { ascending: true })
      ]);
      setClaims(cRes.data || []);
      setExpiring(eRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => ({
    pending: claims.filter(c => ["pending", "inspecting"].includes(c.status)).length,
    resolved: claims.filter(c => c.status === "resolved").length,
    expiring: expiring.filter(e => e.days_remaining <= 60).length,
  }), [claims, expiring]);

  const filtered = useMemo(() => {
    let list = claims;
    if (tab === "pending") list = list.filter(c => ["pending", "inspecting"].includes(c.status));
    if (tab === "resolved") list = list.filter(c => c.status === "resolved");
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => 
        (c.claim_no || "").toLowerCase().includes(q) || 
        (c.invoice_no || "").toLowerCase().includes(q) || 
        (c.product_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [claims, tab, search]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">🛡️ Warranty Claims</h1>
          <p className="text-xs text-gray-500 mt-0.5">Customer claims සහ Supplier warranty tracking</p>
        </div>
        <div className="flex gap-2">
          <Link href="/warranty/expiring" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-bold">⚠️ Expiring Stock</Link>
          <Link href="/warranty/new" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold">➕ New Claim</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">🟡 Pending Claims</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">✅ Resolved Claims</p>
          <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">⚠️ Expiring (60d)</p>
          <p className="text-2xl font-bold text-orange-400">{stats.expiring}</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-gray-700 overflow-x-auto pb-1">
          {[
            { k: "all", l: "All Claims" }, { k: "pending", l: "🟡 Pending" }, { k: "resolved", l: "✅ Resolved" }
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${tab === t.k ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400"}`}>{t.l}</button>
          ))}
        </div>
        
        <input 
          type="text" placeholder="🔍 Search claim no, invoice, product..." 
          value={search} onChange={e => setSearch(e.target.value)} 
          className="w-full md:w-80 bg-white text-black p-2 rounded text-sm" 
        />
      </div>

      {/* Claims Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-3">Claim No</th>
              <th className="p-3">Date</th>
              <th className="p-3">Product</th>
              <th className="p-3">Invoice</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-6 text-gray-500">Loading...</td></tr> : 
              filtered.length === 0 ? <tr><td colSpan="6" className="text-center py-6 text-gray-500">No claims found.</td></tr> :
              filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="p-3 font-mono text-xs">{c.claim_no}</td>
                <td className="p-3 text-xs text-gray-400">{c.claim_date}</td>
                <td className="p-3 text-white">{c.product_name}</td>
                <td className="p-3 font-mono text-xs text-gray-400">{c.invoice_no}</td>
                <td className="p-3 text-center">
                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                    c.status === "resolved" ? "bg-green-900/50 text-green-300" : 
                    c.status === "rejected" ? "bg-red-900/50 text-red-300" : "bg-yellow-900/50 text-yellow-300"
                  }`}>{c.status.toUpperCase()}</span>
                </td>
                <td className="p-3 text-right">
                  <Link href={`/warranty/${c.id}`} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}