"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { fmtRs, formatPhone, getPhoneDigits, liveTitleCase } from "@/lib/utils";

const GRADES = {
  "Grade A": { testing: 0, warranty: 0, risk: 0 }, 
  "Grade B": { testing: 500, warranty: 1000, risk: 1000 },
  "Grade C": { testing: 1000, warranty: 1500, risk: 2000 },
  "Grade D": { testing: 1500, warranty: 2000, risk: 3000 },
  "Dead": { testing: 0, warranty: 0, risk: 5000 },
};

export default function TradeInPage() {
  const [tradeIns, setTradeIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [recent, setRecent] = useState([]);

  // Form State
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [item, setItem] = useState({ 
    name: "", brand: "", category: "", serial: "", condition: "Grade A", 
    resale: 0, testing: 0, warranty: 0, profit: 500, risk: 0 
  });

  useEffect(() => { loadRecent(); }, []);

  async function loadRecent() {
    const { data } = await supabase.from("trade_ins").select("*").order("id", { ascending: false }).limit(10);
    setRecent(data || []);
  }

  // 🧮 Auto Calculate Trade-in Value
  const tradeInValue = Math.max(0, item.resale - item.testing - item.warranty - item.profit - item.risk);

  const handleCondition = (grade) => {
    const defaults = GRADES[grade];
    setItem({ ...item, condition: grade, testing: defaults.testing, warranty: defaults.warranty, risk: defaults.risk });
  };

  const saveTradeIn = async () => {
    if (!customer.name || !customer.phone) return setMessage("❌ Customer Name & Phone Required");
    if (!item.name || !item.category || tradeInValue <= 0) return setMessage("❌ Item details and Resale Price Required");

    setLoading(true);
    setMessage("");
    
    const phoneDigits = getPhoneDigits(customer.phone);
    const itemCode = `TRD-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // 1. Save to Trade-ins
      const { data: tradeData, error } = await supabase.from("trade_ins").insert([{
        customer_name: customer.name, customer_phone: phoneDigits, customer_address: customer.address,
        product_name: item.name, trade_in_value: tradeInValue,
        testing_cost: item.testing, warranty_reserve: item.warranty, risk_allowance: item.risk, target_profit: item.profit
      }]).select().single();

      if (error) throw error;

      // 2. Add to Products (Inventory)
      await supabase.from("products").insert([{
        item_code: itemCode, item_name: `${item.brand} ${item.name}`.trim(), brand: item.brand,
        category: item.category, subcategory: "Trade-in", stock_type: "TRADE-IN",
        purchase_price: tradeInValue + item.testing, selling_price: item.resale,
        stock_qty: 1, active: true, show_in_store: true, serial_number: item.serial
      }]);

      setMessage("✅ Trade-in added and moved to Inventory!");
      setCustomer({ name: "", phone: "", address: "" });
      setItem({ name: "", brand: "", category: "", serial: "", condition: "Grade A", resale: 0, testing: 0, warranty: 0, profit: 500, risk: 0 });
      loadRecent();
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">🔄 Trade-In Manager</h1>
        <p className="text-xs text-gray-500 mt-1">පරණ බඩු එකතු කරගෙන Inventory එකට එකතු කිරීම</p>
      </div>

      {message && <div className={`p-3 rounded border text-sm font-medium ${message.startsWith("✅") ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer & Item Details */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
            <h2 className="font-bold text-blue-400">👤 Customer Details</h2>
            <input type="text" placeholder="Name *" value={customer.name} onChange={e => setCustomer({...customer, name: liveTitleCase(e.target.value)})} className="w-full bg-white text-black p-2 rounded text-sm" />
            <input type="text" placeholder="Phone *" value={customer.phone} onChange={e => setCustomer({...customer, phone: formatPhone(e.target.value)})} maxLength={12} className="w-full bg-white text-black p-2 rounded text-sm" />
            <input type="text" placeholder="Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" />
          </div>

          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-3">
            <h2 className="font-bold text-blue-400">📦 Item Details</h2>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Item Name *" value={item.name} onChange={e => setItem({...item, name: e.target.value})} className="col-span-2 bg-white text-black p-2 rounded text-sm" />
              <input type="text" placeholder="Brand" value={item.brand} onChange={e => setItem({...item, brand: e.target.value})} className="bg-white text-black p-2 rounded text-sm" />
              <input type="text" placeholder="Category *" value={item.category} onChange={e => setItem({...item, category: e.target.value})} className="bg-white text-black p-2 rounded text-sm" />
            </div>
            <select value={item.condition} onChange={e => handleCondition(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm">
              {Object.keys(GRADES).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Pricing Calculation */}
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-4 h-fit">
          <h2 className="font-bold text-green-400">🧮 Pricing Calculator</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-gray-400">Expected Resale (Rs)</label><input type="number" value={item.resale} onChange={e => setItem({...item, resale: Number(e.target.value)})} className="w-full bg-white text-black p-2 rounded text-sm font-bold" /></div>
            <div><label className="text-[10px] text-gray-400">Target Profit (Rs)</label><input type="number" value={item.profit} onChange={e => setItem({...item, profit: Number(e.target.value)})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
            <div><label className="text-[10px] text-gray-400">Testing Cost (Rs)</label><input type="number" value={item.testing} onChange={e => setItem({...item, testing: Number(e.target.value)})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
            <div><label className="text-[10px] text-gray-400">Warranty Reserve (Rs)</label><input type="number" value={item.warranty} onChange={e => setItem({...item, warranty: Number(e.target.value)})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
            <div><label className="text-[10px] text-gray-400">Risk Allowance (Rs)</label><input type="number" value={item.risk} onChange={e => setItem({...item, risk: Number(e.target.value)})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
          </div>
          
          <div className="bg-yellow-900/20 border border-yellow-700 p-3 rounded-lg text-center mt-2">
            <p className="text-xs text-yellow-400 font-bold mb-1">Final Trade-in Value</p>
            <p className="text-3xl font-black text-white">{fmtRs(tradeInValue)}</p>
          </div>

          <button onClick={saveTradeIn} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold text-sm">
            {loading ? "Saving..." : "✅ Save Trade-in & Add to Stock"}
          </button>
        </div>
      </div>

      {/* Recent Trade-ins */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl mt-6">
        <h2 className="font-bold mb-3">🕒 Recent Trade-ins</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-300">
            <tr><th className="p-2">Date</th><th className="p-2">Product</th><th className="p-2">Customer</th><th className="p-2 text-right">Value</th></tr>
          </thead>
          <tbody>
            {recent.map(t => (
              <tr key={t.id} className="border-b border-gray-800">
                <td className="p-2 text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="p-2 text-white">{t.product_name}</td>
                <td className="p-2 text-gray-400">{t.customer_name}<br/><span className="text-[10px]">{t.customer_phone}</span></td>
                <td className="p-2 text-right font-bold text-blue-400">{fmtRs(t.trade_in_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}