"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Category Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [catName, setCatName] = useState("");
  const [catImage, setCatImage] = useState("");
  const [subs, setSubs] = useState(""); // Comma separated
  const [brands, setBrands] = useState(""); // Comma separated
  const [specs, setSpecs] = useState([]); // [{ label: '', options: '' }]

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  async function loadData() {
    setLoading(true);
    const [catRes, prodRes] = await Promise.all([
      supabase.from("product_categories").select("*").is("deleted_at", null).order("name"),
      supabase.from("products").select("*").eq("active", true).is("deleted_at", null).order("item_name")
    ]);
    setCategories(catRes.data || []);
    setProducts(prodRes.data || []);
    setLoading(false);
  }

  // Base Products = Template එකක් (Brand සහ Subcategory නැති ඒවා)
  const baseProducts = useMemo(() => {
    return products.filter(p => (!p.brand || p.brand.trim() === "") && (!p.subcategory || p.subcategory.trim() === ""));
  }, [products]);

  // 🏷️ Category Form Logic
  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setCatName(""); setCatImage(""); setSubs(""); setBrands(""); setSpecs([]);
  };

  const handleEditCategory = (c) => {
    setEditingId(c.id);
    setCatName(c.name);
    setCatImage(c.default_image_url || "");
    setSubs((c.subcategories || []).join(", "));
    setBrands((c.brands || []).join(", "));
    setSpecs((c.specs || []).map(s => ({ label: s.label, options: (s.options || []).join(", ") })));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCategory = async () => {
    if (!catName.trim()) return setMessage("❌ Category Name අවශ්‍යයි.");
    
    // Specs Format හදාගැනීම
    const finalSpecs = specs.map(s => ({
      label: s.label.trim(),
      options: s.options.split(",").map(o => o.trim()).filter(Boolean),
      primary: true
    })).filter(s => s.label && s.options.length > 0);

    const payload = {
      name: catName.trim(),
      default_image_url: catImage.trim() || null,
      subcategories: subs.split(",").map(s => s.trim()).filter(Boolean),
      brands: brands.split(",").map(b => b.trim()).filter(Boolean),
      specs: finalSpecs
    };

    if (editingId) {
      const { error } = await supabase.from("product_categories").update(payload).eq("id", editingId);
      if (error) return setMessage("❌ " + error.message);
      setMessage("✅ Category Updated!");
    } else {
      const { error } = await supabase.from("product_categories").insert([payload]);
      if (error) return setMessage("❌ " + error.message);
      
      // 🆕 අලුත් Category එකක් හැදුවම Base Product එකක් ඔටෝම හැදෙනවා
      const prefix = catName.trim().substring(0, 3).toUpperCase();
      const randCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
      
      await supabase.from("products").insert([{
        item_code: randCode, item_name: catName.trim(), category: catName.trim(),
        stock_qty: 0, active: true, show_in_store: false
      }]);
      setMessage("✅ Category Added + Base Product created!");
    }
    resetForm();
    loadData();
  };

  const addSpecField = () => setSpecs([...specs, { label: "", options: "" }]);
  const updateSpec = (index, field, value) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };
  const removeSpec = (index) => setSpecs(specs.filter((_, i) => i !== index));

  // 📥 Export Base Products to Excel
  const exportBaseToExcel = () => {
    if (baseProducts.length === 0) return alert("Export කරන්න items නෑ!");
    const rows = baseProducts.map(p => ({
      "Item Code": p.item_code, "Item Name": p.item_name, "Category": p.category, "Warranty": p.warranty_months
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base Products");
    XLSX.writeFile(wb, `Base_Products_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">📦 Products & Categories</h1>
        {activeTab === "base" && (
          <button onClick={exportBaseToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold">
            📥 Export Excel
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded border text-sm font-medium ${message.startsWith("✅") ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button onClick={() => setActiveTab("categories")} className={`px-4 py-2 border-b-2 text-sm font-medium ${activeTab === "categories" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400"}`}>📁 Categories</button>
        <button onClick={() => setActiveTab("base")} className={`px-4 py-2 border-b-2 text-sm font-medium ${activeTab === "base" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400"}`}>📦 Base Products</button>
      </div>

      {/* 📁 CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm transition">
              ➕ Add New Category
            </button>
          )}

          {showForm && (
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-blue-400">{editingId ? "✏️ Edit Category" : "➕ Add Category"}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category Name *</label>
                  <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Motherboard" className="w-full bg-white text-black p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Image URL (Optional)</label>
                  <input type="text" value={catImage} onChange={(e) => setCatImage(e.target.value)} placeholder="https://..." className="w-full bg-white text-black p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Subcategories (Comma separated)</label>
                  <input type="text" value={subs} onChange={(e) => setSubs(e.target.value)} placeholder="H610, B660, B760, Z790" className="w-full bg-white text-black p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Brands (Comma separated)</label>
                  <input type="text" value={brands} onChange={(e) => setBrands(e.target.value)} placeholder="ASUS, MSI, Gigabyte" className="w-full bg-white text-black p-2 rounded text-sm" />
                </div>
              </div>

              {/* Specs Builder */}
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-gray-300">⚙️ Specifications</p>
                  <button onClick={addSpecField} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white">+ Add Spec</button>
                </div>
                {specs.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" placeholder="Label (e.g. Socket)" value={s.label} onChange={(e) => updateSpec(i, "label", e.target.value)} className="w-1/3 bg-white text-black p-1.5 rounded text-xs" />
                    <input type="text" placeholder="Options (LGA1700, AM4, AM5)" value={s.options} onChange={(e) => updateSpec(i, "options", e.target.value)} className="flex-1 bg-white text-black p-1.5 rounded text-xs" />
                    <button onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={saveCategory} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm">{editingId ? "Update" : "Save"}</button>
                <button onClick={resetForm} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                      {c.default_image_url ? <img src={c.default_image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-gray-600">🖼️</span>}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{(c.subcategories || []).length} subs · {(c.brands || []).length} brands</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-800">
                  <button onClick={() => handleEditCategory(c)} className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 py-1 rounded text-xs font-bold">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📦 BASE PRODUCTS TAB */}
      {activeTab === "base" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                <th className="p-2">Category</th>
                <th className="p-2 text-center">Warranty</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="4" className="text-center py-4 text-gray-500">Loading...</td></tr> : 
                baseProducts.map(p => (
                  <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-2 font-mono text-xs">{p.item_code}</td>
                    <td className="p-2 text-white">{p.item_name}</td>
                    <td className="p-2 text-gray-400">{p.category}</td>
                    <td className="p-2 text-center text-green-400">{p.warranty_months > 0 ? `${p.warranty_months}M` : "—"}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}