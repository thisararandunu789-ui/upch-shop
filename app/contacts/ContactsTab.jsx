"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPhone, isValidPhone, getPhoneDigits } from "@/lib/utils";

export default function ContactsTab({ type }) {
  const isCustomer = type === "customers";
  const table = isCustomer ? "customers" : "suppliers";
  const nameField = isCustomer ? "customer_name" : "supplier_name";
  const label = isCustomer ? "Customer" : "Supplier";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [phoneMatch, setPhoneMatch] = useState(null); // ඩුප්ලිකේට් ෆෝන් චෙක් කරන්න

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [type]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // 🆕 ලොකු අකුරු වලින් නම ලියද්දී ලස්සන කරන්න (Title Case)
  const liveTitleCase = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

  const loadData = async () => {
    setLoading(true);
    const { data: res, error } = await supabase.from(table).select("*").order("id", { ascending: false });
    if (!error) setData(res || []);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") setForm({ ...form, phone: formatPhone(value) });
    else if (name === "name") setForm({ ...form, name: liveTitleCase(value) });
    else setForm({ ...form, [name]: value });
  };

  // 🆕 ෆෝන් නම්බර් එක දැනටමත් තියෙනවද බලන ලොජික් එක (Customers ට විතරයි)
  useEffect(() => {
    if (!isCustomer || editingId || !form.phone) {
      setPhoneMatch(null);
      return;
    }
    const digits = getPhoneDigits(form.phone);
    if (digits.length === 10) {
      supabase.from("customers").select("id, customer_name, phone, address").eq("phone", digits).maybeSingle()
        .then(({ data }) => setPhoneMatch(data || null));
    } else {
      setPhoneMatch(null);
    }
  }, [form.phone, editingId, isCustomer]);

  const useExistingCustomer = () => {
    if (!phoneMatch) return;
    setEditingId(phoneMatch.id);
    setForm({ name: phoneMatch.customer_name || "", phone: formatPhone(phoneMatch.phone), address: phoneMatch.address || "" });
    setPhoneMatch(null);
    setMessage(`ℹ️ Editing existing customer: ${phoneMatch.customer_name}`);
  };

  const save = async () => {
    if (!form.name.trim()) return setMessage(`❌ ${label} Name අනිවාර්යයි.`);
    if (form.phone && !isValidPhone(form.phone)) return setMessage("❌ Phone number එකේ අංක 10ක් තියෙන්න ඕන.");

    setMessage("");
    const digits = form.phone ? getPhoneDigits(form.phone) : null;
    
    if (isCustomer && digits) {
      let q = supabase.from("customers").select("id").eq("phone", digits);
      if (editingId) q = q.neq("id", editingId);
      const { data: dup } = await q.maybeSingle();
      if (dup) return setMessage("❌ මේ Phone number එක දැනටමත් වෙන customer කෙනෙක්ට save වෙලා තියෙනවා.");
    }

    const payload = { [nameField]: form.name.trim(), phone: digits, address: form.address.trim() || null };

    if (editingId) {
      const { error } = await supabase.from(table).update(payload).eq("id", editingId);
      if (error) return setMessage("❌ Update failed: " + error.message);
      setMessage(`✅ ${label} updated!`);
    } else {
      const { error } = await supabase.from(table).insert([payload]);
      if (error) return setMessage("❌ Save failed: " + error.message);
      setMessage(`✅ ${label} added!`);
    }

    setForm({ name: "", phone: "", address: "" });
    setEditingId(null);
    setShowForm(false);
    setPhoneMatch(null);
    loadData();
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item[nameField] || "", phone: item.phone ? formatPhone(item.phone) : "", address: item.address || "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id, name) => {
    if (!confirm(`Delete "${name}"? මේක undo කරන්න බෑ.`)) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setMessage("❌ Delete failed: " + error.message);
    setMessage(`✅ ${label} deleted!`);
    loadData();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) => 
      (c[nameField] || "").toLowerCase().includes(q) || 
      (c.phone || "").includes(q) || 
      (c.address || "").toLowerCase().includes(q)
    );
  }, [data, search, nameField]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <p className="text-sm text-gray-400">{label} list එක manage කරන්න</p>
        <button
          onClick={() => {
            if (showForm) { setShowForm(false); setEditingId(null); setForm({ name: "", phone: "", address: "" }); }
            else setShowForm(true);
          }}
          className={`text-white px-4 py-2 rounded text-sm font-medium ${showForm ? "bg-gray-700 hover:bg-gray-600" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {showForm ? "✕ Close" : `➕ Add ${label}`}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-gray-800 bg-gray-900 p-4 rounded-xl space-y-4 max-w-md mb-6">
          <h2 className="text-lg font-semibold">{editingId ? `✏️ Edit ${label}` : `➕ Add New ${label}`}</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone {isCustomer && <span className="text-red-400">*</span>}</label>
            <input
              type="text" name="phone" placeholder="077 1234 567" value={form.phone} onChange={handleChange} maxLength={12}
              className="border border-gray-700 p-2 w-full bg-white text-black rounded"
            />
            <p className="text-[10px] text-gray-500 mt-1">💡 අංක 10ක් type කරන්න — auto-format වෙනවා</p>
            
            {phoneMatch && (
              <div className="mt-2 bg-blue-900/20 border border-blue-800 rounded p-2">
                <p className="text-xs text-blue-300 mb-1">ℹ️ මේ phone number එක දැනටමත් save වෙලා:</p>
                <p className="text-sm text-white font-medium">👤 {phoneMatch.customer_name}</p>
                <button onClick={useExistingCustomer} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                  ✏️ Edit මේ Customer එකම
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">{label} Name <span className="text-red-400">*</span></label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              className="border border-gray-700 p-2 w-full bg-white text-black rounded"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Address</label>
            <input
              type="text" name="address" value={form.address} onChange={handleChange}
              className="border border-gray-700 p-2 w-full bg-white text-black rounded"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={save} className={`flex-1 text-white px-4 py-2.5 rounded ${editingId ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {editingId ? "Update" : "Save"}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setForm({ name: "", phone: "", address: "" }); setShowForm(false); }} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded">
                Cancel
              </button>
            )}
          </div>
          {message && <p className={`text-sm font-semibold ${message.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{message}</p>}
        </div>
      )}

      {/* List */}
      <div className="border border-gray-800 bg-gray-900 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">{label} List ({filtered.length})</h2>
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input
              type="text" placeholder={`Search ${label}...`} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-black border border-gray-700 rounded pl-10 pr-3 py-2"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 py-4">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">📭</p>
            <p>No {label}s found.</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {filtered.map((c, i) => (
                <div key={c.id} className="bg-gray-800 rounded p-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{i + 1}. {c[nameField]}</p>
                      {c.phone && <p className="text-xs text-gray-400 mt-1">📞 {formatPhone(c.phone)}</p>}
                      {c.address && <p className="text-xs text-gray-400">📍 {c.address}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-700">
                    <button onClick={() => startEdit(c)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs">✏️ Edit</button>
                    <button onClick={() => remove(c.id, c[nameField])} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs">🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white text-left">
                    <th className="p-2 border border-gray-700 w-12">#</th>
                    <th className="p-2 border border-gray-700">Name</th>
                    <th className="p-2 border border-gray-700">Phone</th>
                    <th className="p-2 border border-gray-700">Address</th>
                    <th className="p-2 border border-gray-700 text-center w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-800/50">
                      <td className="p-2 border border-gray-700 text-gray-400">{i + 1}</td>
                      <td className="p-2 border border-gray-700 text-white font-medium">{c[nameField]}</td>
                      <td className="p-2 border border-gray-700 text-gray-300">{c.phone ? formatPhone(c.phone) : "-"}</td>
                      <td className="p-2 border border-gray-700 text-gray-400 truncate max-w-[200px]">{c.address || "-"}</td>
                      <td className="p-2 border border-gray-700 text-center">
                        <button onClick={() => startEdit(c)} className="text-blue-400 hover:text-blue-300 mr-3">✏️</button>
                        <button onClick={() => remove(c.id, c[nameField])} className="text-red-400 hover:text-red-300">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}