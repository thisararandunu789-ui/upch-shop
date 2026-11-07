"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fmtRs, fmtDate } from "@/lib/utils";


export default function WarrantyDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [claim, setClaim] = useState(null);
  const [supplierClaims, setSupplierClaims] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update State
  const [status, setStatus] = useState("");
  const [resolution, setResolution] = useState("");
  const [shopCost, setShopCost] = useState("");

  useEffect(() => {
    async function load() {
      const [cRes, scRes, supRes] = await Promise.all([
        supabase.from("warranty_claims").select("*, customers(customer_name, phone)").eq("id", id).single(),
        supabase.from("supplier_claims").select("*, suppliers(supplier_name)").eq("claim_id", id),
        supabase.from("suppliers").select("id, supplier_name")
      ]);
      setClaim(cRes.data); setStatus(cRes.data?.status || ""); setResolution(cRes.data?.resolution || ""); setShopCost(cRes.data?.shop_cost || "");
      setSupplierClaims(scRes.data || []); setSuppliers(supRes.data || []);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  const updateClaim = async () => {
    const payload = { status, resolution: resolution || null, shop_cost: Number(shopCost) || 0 };
    if (status === "resolved") payload.resolved_date = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("warranty_claims").update(payload).eq("id", id);
    if (error) return alert(error.message);
    alert("✅ Claim Updated!");
    router.refresh();
  };

  const addSupplierClaim = async () => {
    const supId = prompt(`Select Supplier ID:\n${suppliers.map(s => `[${s.id}] ${s.supplier_name}`).join("\n")}`);
    if (!supId) return;
    const refNo = prompt("Supplier Claim Ref (RMA):");
    if (!refNo) return;

    await supabase.from("supplier_claims").insert([{ claim_id: id, supplier_id: Number(supId), supplier_claim_ref: refNo, status: "pending" }]);
    alert("✅ Supplier Claim Added!");
    window.location.reload();
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;
  if (!claim) return <div className="p-10 text-center text-red-500">Claim not found.</div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold font-mono">{claim.claim_no}</h1>
          <p className="text-xs text-gray-500">{fmtDate(claim.claim_date)}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/warranty/${id}/print`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold">🖨️ Print Receipt</Link>
          <button onClick={() => router.back()} className="bg-gray-700 text-white px-4 py-2 rounded text-sm">← Back</button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl grid grid-cols-2 gap-4">
        <div><p className="text-[10px] text-gray-500 uppercase">Customer</p><p className="text-white font-bold">{claim.customers?.customer_name}</p><p className="text-xs text-gray-400">{claim.customers?.phone}</p></div>
        <div><p className="text-[10px] text-gray-500 uppercase">Product</p><p className="text-white font-bold">{claim.product_name}</p><p className="text-xs text-gray-400">{claim.invoice_no}</p></div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
        <p className="text-xs font-bold text-blue-400">Update Claim Status</p>
        <div className="grid grid-cols-2 gap-3">
          <select value={status} onChange={e => setStatus(e.target.value)} className="bg-white text-black p-2 rounded text-sm">
            <option value="pending">Pending</option><option value="inspecting">Inspecting</option>
            <option value="resolved">Resolved</option><option value="rejected">Rejected</option>
          </select>
          <input type="number" placeholder="Shop Cost (Rs)" value={shopCost} onChange={e => setShopCost(e.target.value)} className="bg-white text-black p-2 rounded text-sm" />
        </div>
        <select value={resolution} onChange={e => setResolution(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm">
          <option value="">— Resolution —</option><option value="replacement">Replacement</option><option value="repair">Repair</option><option value="refund">Refund</option>
        </select>
        <button onClick={updateClaim} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-bold">Save Update</button>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-purple-400">Supplier Claims</p>
          <button onClick={addSupplierClaim} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">+ Add Claim</button>
        </div>
        {supplierClaims.length === 0 ? <p className="text-xs text-gray-500">No supplier claims yet.</p> : 
          supplierClaims.map(sc => (
            <div key={sc.id} className="flex justify-between text-sm border-b border-gray-800 pb-1">
              <span className="text-gray-300">{sc.suppliers?.supplier_name} ({sc.supplier_claim_ref})</span>
              <span className="text-yellow-400">{sc.status}</span>
            </div>
        ))}
      </div>
    </div>
  );
}