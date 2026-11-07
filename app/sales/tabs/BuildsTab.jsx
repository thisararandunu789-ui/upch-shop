"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmtRs } from "@/lib/utils";

export default function BuildsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("builds").select("*").order("id", { ascending: false }).then(({ data }) => {
      setData(data || []); setLoading(false);
    });
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-800 text-gray-300">
          <tr>
            <th className="p-2">Build No</th>
            <th className="p-2">Name</th>
            <th className="p-2">Customer</th>
            <th className="p-2 text-right">Total Price</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr> : data.map(b => (
            <tr key={b.id} className="border-b border-gray-800 hover:bg-gray-800/30">
              <td className="p-2 font-mono text-xs">{b.build_no}</td>
              <td className="p-2 text-white">{b.name || "-"}</td>
              <td className="p-2 text-gray-400">{b.customer_name || "Walk-in"}</td>
              <td className="p-2 text-right text-green-400 font-bold">{fmtRs(b.total_price)}</td>
              <td className="p-2 text-center">
                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">{b.status.toUpperCase()}</span>
              </td>
              <td className="p-2 text-center">
                <Link href={`/builds/${b.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-bold">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}