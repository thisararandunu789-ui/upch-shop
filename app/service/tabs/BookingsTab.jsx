"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("service_bookings").select("*").order("id", { ascending: false });
    setBookings(data || []); setLoading(false);
  }

  const convertToJob = async (b) => {
    if (!confirm(`Create Repair Job for ${b.customer_name}?`)) return;
    const jobNo = `JOB-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}`;
    
    const { data: job, error } = await supabase.from("service_jobs").insert([{
      job_no: jobNo, customer_name: b.customer_name, phone: b.phone,
      device_type: b.device_type, brand: b.brand, model: b.model,
      problem_description: b.problem_description, status: "Received"
    }]).select().single();

    if (!error) {
      await supabase.from("service_bookings").update({ status: "Converted" }).eq("id", b.id);
      alert(`✅ Job ${jobNo} created!`);
      load();
    } else { alert("❌ " + error.message); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {loading ? <p className="text-gray-500">Loading...</p> : bookings.map(b => (
        <div key={b.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-white">{b.customer_name}</p>
              <p className="text-xs text-gray-400">📞 {b.phone}</p>
            </div>
            <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-300">{b.status}</span>
          </div>
          <p className="text-sm text-gray-300">💻 {b.device_type} {b.brand} {b.model}</p>
          <p className="text-xs text-gray-500 line-clamp-2">{b.problem_description}</p>
          {b.status === "Pending" && (
            <button onClick={() => convertToJob(b)} className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold mt-2">Create Job</button>
          )}
        </div>
      ))}
    </div>
  );
}