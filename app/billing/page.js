"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPhone, PAYMENT_METHODS, getPaymentLabel } from "@/lib/utils";

export default function BillingPage() {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  
  // Form State
  const [itemMode, setItemMode] = useState("product"); // product | service
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  
  const [qty, setQty] = useState("1");
  const [itemDiscount, setItemDiscount] = useState("");
  const [cart, setCart] = useState([]);
  
  // Totals & Payments
  const [fullDiscount, setFullDiscount] = useState("");
  const [payments, setPayments] = useState([{ method: "Cash", amount: "" }]);
  const [notes, setNotes] = useState("");
  
  // Trade-ins & Edit
  const [tradeIns, setTradeIns] = useState([]);
  const [tradeInModal, setTradeInModal] = useState(false);
  const [availableTradeIns, setAvailableTradeIns] = useState([]);
  const [editingSale, setEditingSale] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  async function loadInitialData() {
    setLoading(true);
    const [prodRes, svcRes, custRes, salesRes] = await Promise.all([
      supabase.from("products").select("id, item_code, item_name, stock_qty, selling_price, warranty_months, brand, subcategory").eq("active", true).order("item_name"),
      supabase.from("services").select("id, service_code, service_name, price").eq("active", true).order("service_name"),
      supabase.from("customers").select("id, customer_name, phone").order("customer_name"),
      supabase.from("sales").select("*, customers(customer_name)").order("id", { ascending: false }).limit(15)
    ]);

    // Base Products ඉවත් කිරීම
    const variantsOnly = (prodRes.data || []).filter(p => (p.brand && p.brand.trim() !== "") || (p.subcategory && p.subcategory.trim() !== ""));
    
    setProducts(variantsOnly);
    setServices(svcRes.data || []);
    setCustomers(custRes.data || []);
    setRecentSales(salesRes.data || []);
    setLoading(false);
  }

  // Filtered lists based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.slice(0, 50);
    const q = searchTerm.toLowerCase();
    return products.filter(p => p.item_name.toLowerCase().includes(q) || p.item_code.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q))).slice(0, 50);
  }, [products, searchTerm]);

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services.slice(0, 50);
    const q = searchTerm.toLowerCase();
    return services.filter(s => s.service_name.toLowerCase().includes(q) || s.service_code.toLowerCase().includes(q)).slice(0, 50);
  }, [services, searchTerm]);

  // 🧮 Calculations
  const subtotal = cart.reduce((sum, c) => sum + (c.qty * c.unit_price), 0);
  const itemDiscountsTotal = cart.reduce((sum, c) => sum + (Number(c.discount) || 0), 0);
  const tradeInTotal = tradeIns.reduce((sum, t) => sum + Number(t.trade_in_value || 0), 0);
  
  const eligibleBase = subtotal - itemDiscountsTotal;
  const effFullDiscount = Math.min(Number(fullDiscount) || 0, eligibleBase);
  const grandTotal = Math.max(0, eligibleBase - effFullDiscount - tradeInTotal);
  
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = grandTotal - totalPaid;

  // 🛒 Cart Actions
  const addToCart = () => {
    if (itemMode === "product" && selectedProduct) {
      const p = products.find(x => x.id === Number(selectedProduct));
      if (!p) return;
      const q = Number(qty);
      if (q > p.stock_qty) return setMessage(`❌ Stock මදි! දැනට තියෙන්නේ ${p.stock_qty} විතරයි.`);
      
      const existingIdx = cart.findIndex(c => c.type === "product" && c.id === p.id);
      if (existingIdx >= 0) {
        const newCart = [...cart];
        newCart[existingIdx].qty += q;
        newCart[existingIdx].discount += Number(itemDiscount) || 0;
        setCart(newCart);
      } else {
        setCart([...cart, { type: "product", id: p.id, name: p.item_name, code: p.item_code, qty: q, unit_price: p.selling_price, discount: Number(itemDiscount) || 0, warranty: p.warranty_months }]);
      }
      setSelectedProduct(""); setQty("1"); setItemDiscount(""); setSearchTerm(""); setMessage("");
    } 
    else if (itemMode === "service" && selectedService) {
      const s = services.find(x => x.id === Number(selectedService));
      if (!s) return;
      const existingIdx = cart.findIndex(c => c.type === "service" && c.id === s.id);
      if (existingIdx >= 0) {
        const newCart = [...cart];
        newCart[existingIdx].qty += Number(qty);
        newCart[existingIdx].discount += Number(itemDiscount) || 0;
        setCart(newCart);
      } else {
        setCart([...cart, { type: "service", id: s.id, name: s.service_name, code: s.service_code, qty: Number(qty), unit_price: s.price, discount: Number(itemDiscount) || 0 }]);
      }
      setSelectedService(""); setQty("1"); setItemDiscount(""); setSearchTerm(""); setMessage("");
    }
  };

  const updateCartItem = (idx, field, value) => {
    const newCart = [...cart];
    newCart[idx][field] = value;
    setCart(newCart);
  };

  const removeCartItem = (idx) => setCart(cart.filter((_, i) => i !== idx));

  // 💳 Payment Actions
  const addPayment = () => setPayments([...payments, { method: "Cash", amount: "" }]);
  const updatePayment = (idx, field, val) => {
    const newP = [...payments];
    newP[idx][field] = val;
    setPayments(newP);
  };
  const removePayment = (idx) => setPayments(payments.filter((_, i) => i !== idx));
  const fillPayment = () => {
    if (payments.length === 0) setPayments([{ method: "Cash", amount: String(grandTotal) }]);
    else {
      const newP = [...payments];
      newP[0].amount = String(grandTotal);
      setPayments(newP);
    }
  };

  // 🔄 Trade-in Actions
  const openTradeInModal = async () => {
    const { data } = await supabase.from("trade_ins").select("*").is("sale_id", null).order("id", { ascending: false });
    setAvailableTradeIns(data || []);
    setTradeInModal(true);
  };

  const applyTradeIn = (t) => {
    if (tradeIns.find(item => item.id === t.id)) return setMessage("❌ මේක දැනටමත් එකතු කරලා තියෙනවා.");
    setTradeIns([...tradeIns, t]);
    setTradeInModal(false);
  };

  // 🗑️ Delete / Edit Sale Logic
  const deleteSaleCore = async (sale) => {
    // 1. Restore Stock
    const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", sale.id);
    for (const item of (items || [])) {
      if (item.product_id) {
        const { data: prod } = await supabase.from("products").select("stock_qty").eq("id", item.product_id).single();
        if (prod) await supabase.from("products").update({ stock_qty: prod.stock_qty + item.qty }).eq("id", item.product_id);
      }
    }
    // 2. Unlink Trade-ins & Delete
    await supabase.from("trade_ins").update({ sale_id: null }).eq("sale_id", sale.id);
    await supabase.from("sale_items").delete().eq("sale_id", sale.id);
    await supabase.from("sales").delete().eq("id", sale.id);
  };

  const handleDeleteSale = async (sale) => {
    if (!confirm(`ඉන්වොයිස් එක (${sale.invoice_no}) Delete කරන්නද? බඩු ටික ආයේ Stock එකට එකතු වෙනවා.`)) return;
    setSaving(true);
    try {
      await deleteSaleCore(sale);
      setMessage("✅ බිල සාර්ථකව Delete කළා!");
      loadInitialData();
    } catch (err) {
      setMessage("❌ Delete failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSale = async (sale) => {
    setSaving(true);
    try {
      const { data: items } = await supabase.from("sale_items").select(`*, products(item_code, item_name, warranty_months), services(service_code, service_name)`).eq("sale_id", sale.id);
      const { data: linkedTIs } = await supabase.from("trade_ins").select("*").eq("sale_id", sale.id);

      setCart((items || []).map(it => ({
        type: it.service_id ? "service" : "product",
        id: it.service_id || it.product_id,
        name: it.service_id ? (it.service_name || it.services?.service_name) : (it.products?.item_name),
        code: it.service_id ? it.services?.service_code : it.products?.item_code,
        qty: it.qty,
        unit_price: it.unit_price,
        discount: it.discount || 0,
        warranty: it.products?.warranty_months
      })));

      setSelectedCustomerId(sale.customer_id ? String(sale.customer_id) : "");
      setTradeIns(linkedTIs || []);
      setFullDiscount(sale.discount ? String(sale.discount) : "");
      setNotes(sale.notes || "");
      setPayments([{ method: "Cash", amount: String(sale.grand_total) }]);
      setEditingSale(sale);
      setMessage("✏️ බිල Edit කිරීමට Load කළා.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMessage("❌ Edit failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 💾 Save Sale
  const saveSale = async () => {
    if (cart.length === 0 && tradeIns.length === 0) return setMessage("❌ Cart එකේ items නෑ.");
    if (totalPaid < grandTotal) return setMessage(`❌ Payment එක Rs. ${grandTotal.toLocaleString()} ට වඩා අඩුයි.`);
    if (totalPaid > grandTotal) return setMessage(`❌ Payment එක Rs. ${grandTotal.toLocaleString()} ට වඩා වැඩියි.`);

    setSaving(true);
    const invNo = editingSale ? editingSale.invoice_no : `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000)+1000}`;
    const combinedMethod = payments.length === 1 ? payments[0].method : "Multiple";

    try {
      if (editingSale) await deleteSaleCore(editingSale);

      const itemsPayload = cart.map(c => ({
        type: c.type,
        product_id: c.type === "product" ? c.id : null,
        service_id: c.type === "service" ? c.id : null,
        service_name: c.type === "service" ? c.name : null,
        qty: c.qty,
        unit_price: c.unit_price,
        discount: Number(c.discount) || 0,
      }));

      const { data: rpcData, error } = await supabase.rpc("create_sale", {
        p_invoice_no: invNo,
        p_subtotal: subtotal,
        p_discount: effFullDiscount + tradeInTotal,
        p_grand_total: grandTotal,
        p_payment_method: combinedMethod,
        p_notes: notes || null,
        p_items: itemsPayload,
        p_customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        p_payment_breakdown: payments.filter(p => Number(p.amount) > 0)
      });

      if (error) throw new Error(error.message);
      
      const newSaleId = typeof rpcData === 'object' ? (rpcData.id || rpcData.sale_id) : rpcData;

      if (tradeIns.length > 0 && newSaleId) {
        await supabase.from("trade_ins").update({ sale_id: newSaleId }).in("id", tradeIns.map(t => t.id));
      }

      setMessage(`✅ සාර්ථකව සේව් වුණා! (${invNo})`);
      resetForm();
      loadInitialData();
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCart([]); setTradeIns([]); setPayments([{ method: "Cash", amount: "" }]);
    setFullDiscount(""); setNotes(""); setSelectedCustomerId(""); setEditingSale(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">💰 Billing</h1>
        {editingSale && <span className="bg-yellow-900/50 text-yellow-300 border border-yellow-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">✏️ Editing: {editingSale.invoice_no}</span>}
      </div>

      {message && (
        <div className={`p-3 rounded border text-sm font-medium ${message.startsWith("✅") ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: Add Items */}
        <div className="bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-xl space-y-4 h-fit">
          <h2 className="text-lg font-bold">🛒 Add Item</h2>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">Customer (Optional)</label>
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full bg-white text-black p-2.5 rounded text-sm">
              <option value="">👤 Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name} {c.phone ? `(${formatPhone(c.phone)})` : ""}</option>)}
            </select>
          </div>

          <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
            <button onClick={() => { setItemMode("product"); setSearchTerm(""); }} className={`flex-1 py-1.5 text-sm font-medium rounded ${itemMode === "product" ? "bg-blue-600 text-white" : "text-gray-400"}`}>📦 Product</button>
            <button onClick={() => { setItemMode("service"); setSearchTerm(""); }} className={`flex-1 py-1.5 text-sm font-medium rounded ${itemMode === "service" ? "bg-purple-600 text-white" : "text-gray-400"}`}>🛠️ Service</button>
          </div>

          <div>
            <input type="text" placeholder="🔍 Search item..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm mb-2" />
            {itemMode === "product" ? (
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full bg-white text-black p-2.5 rounded text-sm" size={5}>
                {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.item_code} - {p.item_name} (Stock: {p.stock_qty})</option>)}
              </select>
            ) : (
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="w-full bg-white text-black p-2.5 rounded text-sm" size={5}>
                {filteredServices.map(s => <option key={s.id} value={s.id}>{s.service_code} - {s.service_name}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Qty</label>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Item Discount (Rs)</label>
              <input type="number" min="0" value={itemDiscount} onChange={(e) => setItemDiscount(e.target.value)} placeholder="0" className="w-full bg-white text-black p-2 rounded text-sm" />
            </div>
          </div>

          <button onClick={addToCart} className={`w-full py-2.5 rounded font-bold text-white ${itemMode === "product" ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}>
            ➕ Add to Bill
          </button>
        </div>

        {/* RIGHT: Cart & Totals */}
        <div className="bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-bold">🧾 Bill Items</h2>
          
          {cart.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">Cart එක හිස්</p> : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {cart.map((c, i) => (
                <div key={i} className="bg-gray-800 p-2.5 rounded flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.code}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input type="number" min="1" value={c.qty} onChange={(e) => updateCartItem(i, "qty", Number(e.target.value))} className="w-12 text-center bg-white text-black text-xs rounded p-1" />
                    <span className="text-sm font-bold text-white w-20 text-right">Rs. {(c.qty * c.unit_price).toLocaleString()}</span>
                    <button onClick={() => removeCartItem(i)} className="text-red-400 hover:text-red-300">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tradeIns.length > 0 && (
            <div className="bg-blue-900/20 p-2 rounded border border-blue-800/50">
              <p className="text-xs font-bold text-blue-300 mb-1">🔄 Trade-ins Applied</p>
              {tradeIns.map(t => (
                <div key={t.id} className="flex justify-between text-xs text-white">
                  <span>{t.product_name}</span>
                  <span>− Rs. {Number(t.trade_in_value).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-gray-700 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
            {itemDiscountsTotal > 0 && <div className="flex justify-between text-yellow-400"><span>Item Discounts</span><span>− Rs. {itemDiscountsTotal.toLocaleString()}</span></div>}
            {tradeInTotal > 0 && <div className="flex justify-between text-blue-400"><span>Trade-in Value</span><span>− Rs. {tradeInTotal.toLocaleString()}</span></div>}
            
            <div className="flex justify-between items-center text-gray-400">
              <span>Full Bill Discount</span>
              <input type="number" value={fullDiscount} onChange={(e) => setFullDiscount(e.target.value)} placeholder="0" className="w-24 bg-white text-black p-1 rounded text-right text-sm" />
            </div>

            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
              <span>Total</span><span className="text-green-400">Rs. {grandTotal.toLocaleString()}</span>
            </div>

            <button onClick={openTradeInModal} className="w-full mt-2 bg-gray-800 hover:bg-gray-700 text-blue-300 text-xs py-2 rounded border border-gray-700">🔄 Search & Apply Trade-in</button>
          </div>

          <div className="pt-3 border-t border-gray-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-300">💳 Payments</span>
              <div className="flex gap-2">
                <button onClick={fillPayment} className="text-xs text-gray-400 underline">Fill Total</button>
                <button onClick={addPayment} className="text-xs bg-blue-600 px-2 py-1 rounded text-white">+ Add</button>
              </div>
            </div>
            {payments.map((p, i) => (
              <div key={i} className="flex gap-2">
                <select value={p.method} onChange={(e) => updatePayment(i, "method", e.target.value)} className="bg-white text-black text-xs p-1.5 rounded flex-1">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="number" value={p.amount} onChange={(e) => updatePayment(i, "amount", e.target.value)} placeholder="Amount" className="w-24 bg-white text-black text-xs p-1.5 rounded text-right" />
                {payments.length > 1 && <button onClick={() => removePayment(i)} className="text-red-400">✕</button>}
              </div>
            ))}
            {balanceDue !== 0 && <p className={`text-xs text-right font-bold ${balanceDue > 0 ? "text-red-400" : "text-yellow-400"}`}>Balance: Rs. {balanceDue.toLocaleString()}</p>}
          </div>

          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (Optional)" className="w-full bg-white text-black p-2 rounded text-sm mt-2" />

          <div className="flex gap-2 pt-2">
            {editingSale && <button onClick={resetForm} className="bg-gray-700 text-white px-4 py-3 rounded font-bold text-sm">Cancel</button>}
            <button onClick={saveSale} disabled={saving || cart.length === 0} className={`flex-1 py-3 rounded font-bold text-sm text-white ${editingSale ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}`}>
              {saving ? "Saving..." : editingSale ? "Update Sale" : "✅ Complete Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sales List */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl mt-6">
        <h2 className="text-lg font-bold mb-4">Recent Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-2 rounded-tl">Invoice</th>
                <th className="p-2">Date</th>
                <th className="p-2">Customer</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-center rounded-tr">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(s => (
                <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="p-2 font-mono text-xs">{s.invoice_no}</td>
                  <td className="p-2 text-xs text-gray-400">{new Date(s.sale_date).toLocaleDateString()}</td>
                  <td className="p-2">{s.customers?.customer_name || "Walk-in"}</td>
                  <td className="p-2 text-right font-bold text-green-400">{Number(s.grand_total).toLocaleString()}</td>
                  <td className="p-2 text-center space-x-2">
                    <Link href={`/bill/${s.id}`} className="text-blue-400 hover:text-blue-300">🖨️ Print</Link>
                    <button onClick={() => handleEditSale(s)} className="text-yellow-400 hover:text-yellow-300">✏️ Edit</button>
                    <button onClick={() => handleDeleteSale(s)} className="text-red-400 hover:text-red-300">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade-in Modal */}
      {tradeInModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-gray-700">
            <div className="p-4 border-b border-gray-800 flex justify-between">
              <h3 className="font-bold text-blue-400">🔄 Select Trade-in</h3>
              <button onClick={() => setTradeInModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {availableTradeIns.length === 0 ? <p className="text-center text-gray-500">No available trade-ins.</p> : 
                availableTradeIns.map(t => (
                  <div key={t.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-medium">{t.product_name}</p>
                      <p className="text-xs text-gray-400">{t.customer_name} · Rs. {Number(t.trade_in_value).toLocaleString()}</p>
                    </div>
                    <button onClick={() => applyTradeIn(t)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold">Apply</button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}