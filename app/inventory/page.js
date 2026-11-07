"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  liveTitleCase, liveUpperCase, generateNextVariantCode, 
  formatPhone 
} from "@/lib/utils";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  // Form State
  const [baseProductId, setBaseProductId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [qty, setQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [warranty, setWarranty] = useState("");
  const [showInStore, setShowInStore] = useState(true);
  const [supplierId, setSupplierId] = useState("");

  // List State
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [prodRes, suppRes] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("item_name"),
      supabase.from("suppliers").select("id, supplier_name, phone").order("supplier_name")
    ]);
    setProducts(prodRes.data || []);
    setSuppliers(suppRes.data || []);
    setLoading(false);
  }

  // Base products (Template) සහ Variants වෙන් කරගැනීම
  const baseProducts = useMemo(() => {
    return products.filter((p) => {
      const hasBrand = p.brand && p.brand.trim() !== "";
      const hasSub = p.subcategory && p.subcategory.trim() !== "";
      return !hasBrand && !hasSub;
    });
  }, [products]);

  const variants = useMemo(() => {
    return products.filter((p) => {
      const hasBrand = p.brand && p.brand.trim() !== "";
      const hasSub = p.subcategory && p.subcategory.trim() !== "";
      return hasBrand || hasSub;
    });
  }, [products]);

  const selectedBase = baseProducts.find((p) => p.id === Number(baseProductId));

  const filteredVariants = useMemo(() => {
    if (!search.trim()) return variants;
    const q = search.toLowerCase();
    return variants.filter((v) => 
      (v.item_name || "").toLowerCase().includes(q) || 
      (v.item_code || "").toLowerCase().includes(q) ||
      (v.brand || "").toLowerCase().includes(q)
    );
  }, [variants, search]);

  // අලුත් Variant එකක් හදන Function එක
  async function findOrCreateVariant() {
    const finalBrand = liveTitleCase(brand);
    const finalModel = liveUpperCase(model);

    // 1. දැනටමත් තියෙනවද බලනවා
    const { data: existing } = await supabase.from("products")
      .select("*")
      .eq("active", true)
      .eq("brand", finalBrand)
      .eq("subcategory", finalModel)
      .eq("category", selectedBase.category)
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0]; // තියෙනවා නම් ඒක දෙනවා
    }

    // 2. අලුත් එකක් හදනවා
    const newCode = await generateNextVariantCode(supabase, selectedBase.item_code);
    const variantName = `${finalBrand} ${finalModel}`;

    const { data: newProduct, error } = await supabase.from("products").insert([{
      item_name: variantName,
      item_code: newCode,
      category: selectedBase.category,
      subcategory: finalModel,
      brand: finalBrand,
      purchase_price: Number(buyPrice) || 0,
      selling_price: Number(sellPrice) || 0,
      minimum_stock: 1,
      warranty_months: Number(warranty) || 0,
      show_in_store: showInStore,
      stock_qty: 0,
      active: true,
    }]).select().single();

    if (error) throw new Error(error.message);
    return newProduct;
  }

  async function handleAddStock(e) {
    e.preventDefault();
    if (!baseProductId) return setMessage("❌ Base Product එකක් තෝරන්න.");
    if (!brand || !model) return setMessage("❌ Brand සහ Model අනිවාර්යයි.");
    if (!qty || Number(qty) <= 0) return setMessage("❌ Quantity එකක් දාන්න.");

    setSaving(true);
    setMessage("");

    try {
      // 1. Variant එක හොයාගන්න හෝ හදන්න
      const targetProduct = await findOrCreateVariant();

      // 2. Stock Transaction එක සේව් කරන්න
      const { error: logError } = await supabase.from("stock_transactions").insert([{
        product_id: targetProduct.id,
        transaction_type: "IN",
        qty: Number(qty),
        notes: "Manual Stock In",
        supplier_id: supplierId ? Number(supplierId) : null,
      }]);

      if (logError) throw new Error(logError.message);

      setMessage(`✅ ${targetProduct.item_name} ට ${qty} ක් එකතු කළා!`);
      
      // Form එක reset කරන්න
      setBaseProductId(""); setBrand(""); setModel(""); setQty("");
      setBuyPrice(""); setSellPrice(""); setWarranty(""); setSupplierId("");
      
      loadData(); // අලුත් ඩේටා ලෝඩ් කරන්න
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">📥 Inventory Manager</h1>
        <p className="text-xs text-gray-500 mt-1">Stock එකතු කිරීම සහ පවතින Stock එක බැලීම</p>
      </div>

      {message && (
        <div className={`p-3 rounded border text-sm ${message.startsWith("✅") ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>
          {message}
        </div>
      )}

      {/* Add Stock Form */}
      <div className="bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-blue-400 mb-4">📦 Add New Stock / Variant</h2>
        
        <form onSubmit={handleAddStock} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Base Product *</label>
            <select 
              value={baseProductId} 
              onChange={(e) => setBaseProductId(e.target.value)}
              className="w-full bg-white text-black p-2.5 rounded text-sm"
            >
              <option value="">— Select Base Product —</option>
              {baseProducts.map(p => (
                <option key={p.id} value={p.id}>{p.item_code} — {p.item_name}</option>
              ))}
            </select>
          </div>

          {selectedBase && (
            <div className="grid grid-cols-2 gap-3 bg-gray-800/50 p-3 rounded border border-gray-700">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Brand *</label>
                <input 
                  type="text" value={brand} onChange={(e) => setBrand(liveTitleCase(e.target.value))}
                  placeholder="e.g. ASUS" className="w-full bg-white text-black p-2 rounded text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Model *</label>
                <input 
                  type="text" value={model} onChange={(e) => setModel(liveUpperCase(e.target.value))}
                  placeholder="e.g. H610M" className="w-full bg-white text-black p-2 rounded text-sm" 
                />
              </div>
            </div>
          )}

          {selectedBase && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Qty *</label>
                <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Buy Price</label>
                <input type="number" min="0" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Sell Price</label>
                <input type="number" min="0" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Warranty (Months)</label>
                <input type="number" min="0" value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm" />
              </div>
            </div>
          )}

          {selectedBase && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Supplier (optional)</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full bg-white text-black p-2 rounded text-sm">
                  <option value="">— No Supplier —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showInStore} onChange={(e) => setShowInStore(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm text-gray-300">Show in Public Store</span>
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" disabled={saving || !baseProductId} 
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-6 py-2.5 rounded font-medium text-sm transition"
          >
            {saving ? "Saving..." : "➕ Add Stock"}
          </button>
        </form>
      </div>

      {/* Current Variants List */}
      <div className="bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">📋 Current Variants ({filteredVariants.length})</h2>
          <input 
            type="text" placeholder="🔍 Search by name, code, brand..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 bg-white text-black p-2 rounded text-sm"
          />
        </div>

        {loading ? (
          <p className="text-gray-400 py-4">Loading data...</p>
        ) : filteredVariants.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">No variants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-800 text-white text-left">
                  <th className="p-2 border border-gray-700">Code</th>
                  <th className="p-2 border border-gray-700">Name</th>
                  <th className="p-2 border border-gray-700">Brand</th>
                  <th className="p-2 border border-gray-700 text-right">Buy</th>
                  <th className="p-2 border border-gray-700 text-right">Sell</th>
                  <th className="p-2 border border-gray-700 text-center">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariants.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-800/50">
                    <td className="p-2 border border-gray-700 font-mono text-xs">{v.item_code}</td>
                    <td className="p-2 border border-gray-700 text-white">{v.item_name}</td>
                    <td className="p-2 border border-gray-700 text-gray-300">{v.brand || "-"}</td>
                    <td className="p-2 border border-gray-700 text-right text-gray-400">{Number(v.purchase_price || 0).toLocaleString()}</td>
                    <td className="p-2 border border-gray-700 text-right text-gray-200">{Number(v.selling_price || 0).toLocaleString()}</td>
                    <td className="p-2 border border-gray-700 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${Number(v.stock_qty) > 0 ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"}`}>
                        {v.stock_qty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}