"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { fmtRs } from "@/lib/utils";

export default function LookupPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    const searchProducts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .or(`item_name.ilike.%${query}%,item_code.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(10);
      
      setProducts(data || []);
      setLoading(false);
    };

    const delayDebounceFn = setTimeout(() => {
      searchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">🔍 Product Lookup</h1>
        <p className="text-xs text-gray-500 mt-1">Item code, name හෝ brand එකෙන් product හොයාගන්න</p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search products (e.g., SSD, Monitor, Logitech)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white text-black p-4 rounded-xl text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {loading && <span className="absolute right-4 top-4 text-gray-500 animate-spin">⏳</span>}
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-lg truncate">{p.item_name}</p>
              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">{p.item_code}</span>
                {p.brand && <span>Brand: {p.brand}</span>}
                {p.category && <span>Category: {p.category}</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0 space-y-1">
              <p className="text-green-400 font-bold">{fmtRs(p.selling_price)}</p>
              <p className={`text-xs font-bold ${p.stock_qty > 0 ? "text-blue-400" : "text-red-400"}`}>
                Stock: {p.stock_qty}
              </p>
            </div>
          </div>
        ))}

        {query && !loading && products.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="text-4xl mb-2">😕</p>
            <p>No products found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}