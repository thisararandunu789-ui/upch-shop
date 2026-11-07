"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPhone, fmtRs } from "@/lib/utils";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_advance");

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase.from("store_orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  const updateStatus = async (id, updates) => {
    const { error } = await supabase.from("store_orders").update(updates).eq("id", id);
    if (error) return alert("❌ " + error.message);
    loadOrders();
  };

  const handleAction = async (o) => {
    // 1. Pending Advance -> Ready to Ship
    if (o.status === "pending_advance") {
      if (!confirm(`Advance ලැබුණාද?\nCustomer: ${o.customer_name}\nAmount: ${fmtRs(o.advance_amount)}`)) return;
      await updateStatus(o.id, { status: "ready_to_ship", advance_confirmed: true });
      // Stock අඩු කිරීම (RPC හරහා)
      await supabase.rpc("deduct_stock_for_order", { p_order_id: o.id });
    } 
    // 2. Ready to Ship -> Shipped
    else if (o.status === "ready_to_ship") {
      const courier = prompt("Courier Name (Domex/Koombiyo):", "Domex");
      if (!courier) return;
      const tracking = prompt("Tracking No (Optional):");
      await updateStatus(o.id, { status: "shipped", courier_name: courier, tracking_no: tracking, shipped_at: new Date().toISOString() });
    } 
    // 3. Shipped -> Delivered
    else if (o.status === "shipped") {
      if (!confirm("Customer ට බඩුව ලැබුණාද?")) return;
      await updateStatus(o.id, { status: "delivered", delivered_at: new Date().toISOString() });
    } 
    // 4. Delivered (COD) -> COD Collected
    else if (o.status === "delivered" && o.payment_method === "COD" && !o.cod_status) {
      if (!confirm(`Courier එකෙන් සල්ලි ආවාද?\nAmount: ${fmtRs(o.cod_total)}`)) return;
      await updateStatus(o.id, { cod_status: "collected", cod_collected_at: new Date().toISOString() });
    } 
    // 5. COD Collected -> Settled
    else if (o.cod_status === "collected") {
      const fee = prompt("Courier Fee (Rs):", "0");
      if (fee === null) return;
      const ref = prompt("Bank Reference No:");
      await updateStatus(o.id, { 
        cod_status: "settled", cod_settled_at: new Date().toISOString(),
        cod_settlement_amount: Number(o.cod_total) - Number(o.advance_amount) - Number(fee),
        cod_courier_fee: Number(fee), cod_settlement_ref: ref 
      });
    }
  };

  const filtered = orders.filter(o => {
    if (filter === "pending_advance") return o.status === "pending_advance";
    if (filter === "ready_to_ship") return o.status === "ready_to_ship";
    if (filter === "shipped") return o.status === "shipped";
    if (filter === "delivered") return o.status === "delivered" && !o.cod_status;
    if (filter === "completed") return o.cod_status === "settled" || (o.status === "delivered" && !o.cod_status && o.payment_method !== "COD");
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { k: "pending_advance", l: "🟡 Pending Advance" },
          { k: "ready_to_ship", l: "📦 Ready to Ship" },
          { k: "shipped", l: "🚚 Shipped" },
          { k: "delivered", l: "✅ Delivered (COD Pending)" },
          { k: "completed", l: "💰 Completed" },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-bold transition ${filter === f.k ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>{f.l}</button>
        ))}
      </div>

      {loading ? <p className="text-center text-gray-500 py-6">Loading...</p> : filtered.length === 0 ? <p className="text-center text-gray-500 py-6">No orders found.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(o => (
            <div key={o.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-white text-sm">{o.order_no}</p>
                    <p className="text-[10px] text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded border border-gray-700">{o.payment_method}</span>
                </div>
                <p className="text-sm text-white font-medium">👤 {o.customer_name}</p>
                <p className="text-xs text-gray-400">📞 {formatPhone(o.customer_phone)}</p>
                <p className="text-lg font-bold text-green-400 mt-2">{fmtRs(o.total)}</p>
                {o.courier_name && <p className="text-xs text-blue-400 mt-1">🚚 {o.courier_name} - {o.tracking_no || "No Tracking"}</p>}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-800">
                <button onClick={() => handleAction(o)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-xs font-bold">
                  {o.status === "pending_advance" ? "Confirm Advance" :
                   o.status === "ready_to_ship" ? "Ship Order" :
                   o.status === "shipped" ? "Mark Delivered" :
                   (o.status === "delivered" && o.payment_method === "COD" && !o.cod_status) ? "Collect COD" :
                   o.cod_status === "collected" ? "Settle COD" : "Completed ✅"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}