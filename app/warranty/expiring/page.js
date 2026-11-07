"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ExpiringWarranty() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("v_warranty_expiring").select("*").order("days_remaining", { ascending: true }).then(({ data }) => {
      setData(data || []); setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">⚠️ Expiring Supplier Warranty</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-300">
            <tr><th className="p-3">GRN / Date</th><th className="p-3">Product</th><th className="p-3">Supplier</th><th className="p-3 text-right">Stock</th><th className="p-3 text-center">Days Left</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-6">Loading...</td></tr> : 
              data.map((row, i) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="p-3 font-mono text-xs">{row.grn_no}<br/><span className="text-[10px] text-gray-500">{row.purchase_date}</span></td>
                  <td className="p-3 text-white">{row.item_name}<br/><span className="text-[10px] text-gray-500">{row.item_code}</span></td>
                  <td className="p-3 text-gray-400">{row.supplier_name}</td>
                  <td className="p-3 text-right font-bold">{row.current_stock}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.days_remaining <= 30 ? "bg-red-900/50 text-red-300" : "bg-yellow-900/50 text-yellow-300"}`}>{row.days_remaining}d</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}