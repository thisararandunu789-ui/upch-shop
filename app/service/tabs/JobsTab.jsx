"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmtRs } from "@/lib/utils";

export default function JobsTab() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("service_jobs").select("*").order("id", { ascending: false }).then(({ data }) => {
      setJobs(data || []); setLoading(false);
    });
  }, []);

  const filtered = jobs.filter(j => 
    (j.job_no || "").toLowerCase().includes(search.toLowerCase()) ||
    (j.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (j.phone || "").includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <input type="text" placeholder="🔍 Search Job No, Customer, Phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-72 bg-white text-black p-2 rounded text-sm" />
        <Link href="/service-jobs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold whitespace-nowrap">➕ New Job</Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-3">Job No</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Device</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-6 text-gray-500">Loading...</td></tr> : filtered.map(j => (
              <tr key={j.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="p-3 font-mono text-xs">{j.job_no}</td>
                <td className="p-3 text-white">{j.customer_name}<br/><span className="text-[10px] text-gray-500">{j.phone}</span></td>
                <td className="p-3 text-gray-400">{j.device_type} <br/><span className="text-[10px]">{j.brand} {j.model}</span></td>
                <td className="p-3 text-center">
                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${j.status === "Delivered" ? "bg-green-900/50 text-green-300" : "bg-blue-900/50 text-blue-300"}`}>{j.status}</span>
                </td>
                <td className="p-3 text-right font-bold text-green-400">{fmtRs(j.final_total)}</td>
                <td className="p-3 text-center">
                  <Link href={`/service-jobs/${j.id}`} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}