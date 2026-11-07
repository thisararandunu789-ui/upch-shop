"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmtRs, fmtDate } from "@/lib/utils";


export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [parts, setParts] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [newService, setNewService] = useState({ id: "", price: "" });
  const [newPart, setNewPart] = useState({ id: "", qty: 1, price: "" });
  const [payment, setPayment] = useState("");

  useEffect(() => {
    async function load() {
      const [jobRes, partRes, svcRes, prodRes] = await Promise.all([
        supabase.from("service_jobs").select("*").eq("id", id).single(),
        supabase.from("service_job_parts").select("*").eq("job_id", id),
        supabase.from("services").select("*").eq("active", true),
        supabase.from("products").select("id, item_name, item_code, stock_qty, selling_price, purchase_price").eq("active", true)
      ]);
      setJob(jobRes.data); setParts(partRes.data || []); setServices(svcRes.data || []); setProducts(prodRes.data || []);
      setPayment(String(Number(jobRes.data?.final_total || 0) - Number(jobRes.data?.advance_paid || 0)));
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  const updateStatus = async (status) => {
    await supabase.from("service_jobs").update({ status, delivered_date: status === "Delivered" ? new Date().toISOString() : null }).eq("id", id);
    setJob({ ...job, status });
  };

  const addPart = async () => {
    if (!newPart.id) return;
    const prod = products.find(p => p.id === Number(newPart.id));
    const qty = Number(newPart.qty);
    const price = Number(newPart.price) || Number(prod.selling_price);
    
    // RPC එකෙන් Stock අඩු කරලා Part එක එකතු කරනවා
    const { error } = await supabase.rpc("add_service_job_part", {
      p_job_id: id, p_product_id: prod.id, p_qty: qty, p_unit_price: price
    });
    
    if (error) return alert(error.message);
    router.refresh();
    window.location.reload(); // Reload to see updated totals
  };

  if (loading || !job) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  const partsTotal = parts.reduce((s, p) => s + Number(p.total), 0);
  const grandTotal = Number(job.service_charge || 0) + partsTotal - Number(job.discount || 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold font-mono">{job.job_no}</h1>
          <p className="text-xs text-gray-500">{fmtDate(job.received_date)}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/service-jobs/${id}/bill`} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold">🖨️ Print Bill</Link>
          <button onClick={() => router.back()} className="bg-gray-700 text-white px-4 py-2 rounded text-sm">← Back</button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl grid grid-cols-2 gap-4">
        <div><p className="text-[10px] text-gray-500 uppercase">Customer</p><p className="text-white font-bold">{job.customer_name}</p><p className="text-xs text-gray-400">{job.phone}</p></div>
        <div><p className="text-[10px] text-gray-500 uppercase">Device</p><p className="text-white font-bold">{job.device_type}</p><p className="text-xs text-gray-400">{job.brand} {job.model}</p></div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase">Add Parts (Auto Stock Deduct)</p>
        <div className="flex gap-2 flex-wrap">
          <select value={newPart.id} onChange={e => setNewPart({...newPart, id: e.target.value})} className="flex-[2] min-w-[200px] bg-white text-black p-2 rounded text-sm">
            <option value="">Select Product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.item_name} (Stock: {p.stock_qty})</option>)}
          </select>
          <input type="number" placeholder="Qty" value={newPart.qty} onChange={e => setNewPart({...newPart, qty: e.target.value})} className="w-16 bg-white text-black p-2 rounded text-sm" />
          <button onClick={addPart} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded text-sm font-bold">Add</button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Summary</p>
        {parts.map(p => (
          <div key={p.id} className="flex justify-between text-sm text-gray-300 border-b border-gray-800 pb-1">
            <span>🔩 {p.product_name} (x{p.qty})</span><span>{fmtRs(p.total)}</span>
          </div>
        ))}
        <div className="flex justify-between text-lg font-bold text-white pt-2">
          <span>Total Amount</span><span className="text-green-400">{fmtRs(grandTotal)}</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex gap-2">
        <button onClick={() => updateStatus("Ready")} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded text-sm font-bold">Mark Ready</button>
        <button onClick={() => updateStatus("Delivered")} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-bold">Mark Delivered</button>
      </div>
    </div>
  );
}