"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CatalogTab() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ code: "", name: "", price: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("services").select("*").eq("active", true).order("service_name");
    setServices(data || []);
  }

  async function addService() {
    if (!form.name || !form.price) return alert("Name & Price required");
    const code = form.code || `SVC-${Math.floor(Math.random()*900)+100}`;
    
    const { error } = await supabase.from("services").insert([{ service_code: code, service_name: form.name, price: Number(form.price), active: true }]);
    if (error) return alert(error.message);
    setForm({ code: "", name: "", price: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[120px]"><label className="text-[10px] text-gray-400">Code</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" placeholder="Optional" /></div>
        <div className="flex-[2] min-w-[200px]"><label className="text-[10px] text-gray-400">Service Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" placeholder="e.g. Windows Install" /></div>
        <div className="flex-1 min-w-[100px]"><label className="text-[10px] text-gray-400">Price</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" placeholder="0" /></div>
        <button onClick={addService} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold h-[38px]">Add</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {services.map(s => (
          <div key={s.id} className="bg-gray-900 border border-gray-800 p-3 rounded flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-white">{s.service_name}</p>
              <p className="text-xs text-gray-400 font-mono">{s.service_code}</p>
            </div>
            <p className="text-green-400 font-bold">Rs. {Number(s.price).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}