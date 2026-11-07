"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", type: "Laptop", brand: "", model: "", problem: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.phone || !form.problem) return alert("Name, Phone & Problem required!");
    setSaving(true);
    const jobNo = `JOB-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}`;
    
    const { data, error } = await supabase.from("service_jobs").insert([{
      job_no: jobNo, customer_name: form.name, phone: form.phone,
      device_type: form.type, brand: form.brand, model: form.model,
      problem_description: form.problem, status: "Received"
    }]).select().single();

    if (error) { alert(error.message); setSaving(false); return; }
    router.push(`/service-jobs/${data.id}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">🔧 Create New Repair Job</h1>
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-400">Customer Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
          <div><label className="text-xs text-gray-400">Phone *</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
          <div><label className="text-xs text-gray-400">Device Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm"><option>Laptop</option><option>Desktop</option><option>Printer</option><option>Other</option></select></div>
          <div><label className="text-xs text-gray-400">Brand</label><input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
        </div>
        <div><label className="text-xs text-gray-400">Problem Description *</label><textarea value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} rows={3} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => router.back()} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-2 rounded font-bold text-sm">{saving ? "Creating..." : "✅ Create Job"}</button>
        </div>
      </div>
    </div>
  );
}