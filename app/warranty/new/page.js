"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fmtDate } from "@/lib/utils";

export default function NewWarrantyClaim() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const [fault, setFault] = useState("");
  const [condition, setCondition] = useState("");
  const [serial, setSerial] = useState("");
  const [saving, setSaving] = useState(false);

  const searchSales = async () => {
    if (!search.trim()) return;
    const { data } = await supabase.from("sales")
      .select("id, invoice_no, sale_date, customers(customer_name, phone)")
      .or(`invoice_no.ilike.%${search}%,customers.phone.ilike.%${search}%`)
      .order("sale_date", { ascending: false }).limit(10);
    setSales(data || []);
  };

  const selectSale = async (sale) => {
    setSelectedSale(sale);
    const { data } = await supabase.from("sale_items")
      .select("id, product_id, qty, products(item_name, item_code, warranty_months)")
      .eq("sale_id", sale.id);
    setItems((data || []).filter(i => i.product_id));
  };

  const saveClaim = async () => {
    if (!selectedItem || !fault.trim()) return alert("Select an item and enter fault!");
    setSaving(true);

    const claimNo = `WAR-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000)+1000}`;

    const { data, error } = await supabase.from("warranty_claims").insert([{
      claim_no: claimNo, customer_id: selectedSale.customers?.id || null, 
      sale_id: selectedSale.id, sale_item_id: selectedItem.id, 
      invoice_no: selectedSale.invoice_no, product_id: selectedItem.product_id,
      product_name: selectedItem.products.item_name, 
      reported_fault: fault, condition_at_handover: condition, serial_no: serial,
      status: "pending", claim_date: new Date().toISOString().split("T")[0]
    }]).select().single();

    if (error) { alert(error.message); setSaving(false); return; }
    router.push(`/warranty/${data.id}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🛡️ Create Warranty Claim</h1>

      {!selectedSale ? (
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-4">
          <label className="text-sm text-gray-400">Search Invoice No or Customer Phone</label>
          <div className="flex gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-white text-black p-2 rounded text-sm" placeholder="INV-2026... / 077..." />
            <button onClick={searchSales} className="bg-blue-600 text-white px-4 rounded text-sm font-bold">Search</button>
          </div>
          <div className="space-y-2 mt-4">
            {sales.map(s => (
              <button key={s.id} onClick={() => selectSale(s)} className="w-full text-left bg-gray-800 p-3 rounded hover:bg-gray-700 flex justify-between items-center">
                <div><p className="font-mono text-xs text-blue-400">{s.invoice_no}</p><p className="text-sm text-white">{s.customers?.customer_name}</p></div>
                <p className="text-xs text-gray-400">{fmtDate(s.sale_date)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-xl flex justify-between items-center">
            <div><p className="text-xs text-blue-300 font-mono">{selectedSale.invoice_no}</p><p className="text-white font-bold">{selectedSale.customers?.customer_name}</p></div>
            <button onClick={() => setSelectedSale(null)} className="text-xs text-gray-400 underline">Change</button>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
            <label className="text-sm text-gray-400">Select Item</label>
            {items.map(i => (
              <button key={i.id} onClick={() => setSelectedItem(i)} className={`w-full text-left p-3 rounded border ${selectedItem?.id === i.id ? "border-green-500 bg-green-900/20" : "border-gray-700 bg-gray-800"}`}>
                <p className="text-white text-sm">{i.products.item_name}</p>
                <p className="text-xs text-gray-400">{i.products.item_code} · Warranty: {i.products.warranty_months}M</p>
              </button>
            ))}
          </div>

          {selectedItem && (
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
              <div><label className="text-xs text-gray-400">Reported Fault *</label><textarea value={fault} onChange={e => setFault(e.target.value)} rows={2} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
              <div><label className="text-xs text-gray-400">Condition at Handover</label><textarea value={condition} onChange={e => setCondition(e.target.value)} rows={2} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
              <div><label className="text-xs text-gray-400">Serial No (Optional)</label><input type="text" value={serial} onChange={e => setSerial(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
              <button onClick={saveClaim} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold text-sm">{saving ? "Creating..." : "✅ Create Claim"}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}