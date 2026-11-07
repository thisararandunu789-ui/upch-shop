"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPhone, fmtRs } from "@/lib/utils";

export default function QuotationsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("quotations").select("*").order("id", { ascending: false }).then(({ data }) => {
      setData(data || []); setLoading(false);
    });
  }, []);

  const updateStatus = async (id, status) => {
    await supabase.from("quotations").update({ status }).eq("id", id);
    setData(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-800 text-gray-300">
          <tr>
            <th className="p-2">Quote No</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Date</th>
            <th className="p-2 text-right">Total</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr> : data.map(q => (
            <tr key={q.id} className="border-b border-gray-800 hover:bg-gray-800/30">
              <td className="p-2 font-mono text-xs">{q.quote_no}</td>
              <td className="p-2">{q.customer_name} <br/><span className="text-[10px] text-gray-500">{q.customer_phone && formatPhone(q.customer_phone)}</span></td>
              <td className="p-2 text-xs text-gray-400">{new Date(q.quote_date).toLocaleDateString()}</td>
              <td className="p-2 text-right text-green-400 font-bold">{fmtRs(q.grand_total)}</td>
              <td className="p-2 text-center">
                <select value={q.status} onChange={(e) => updateStatus(q.id, e.target.value)} className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-700">
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </td>
              <td className="p-2 text-center">
                <Link href={`/quotation/${q.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-bold">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}