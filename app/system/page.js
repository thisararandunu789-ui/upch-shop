"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPhone, getPhoneDigits } from "@/lib/utils";

export default function SystemPage() {
  const [tab, setTab] = useState("settings");
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [setRes, userRes] = await Promise.all([
      supabase.from("settings").select("*").eq("id", 1).single(),
      supabase.from("user_roles").select("*").order("created_at")
    ]);
    setSettings(setRes.data);
    setUsers(userRes.data || []);
    setLoading(false);
  }

  const saveSettings = async () => {
    const payload = {
      shop_name: settings.shop_name,
      address: settings.address,
      phone: settings.phone ? getPhoneDigits(settings.phone) : null,
      bank_name: settings.bank_name,
      bank_account_no: settings.bank_account_no,
      bank_account_name: settings.bank_account_name,
    };
    const { error } = await supabase.from("settings").update(payload).eq("id", 1);
    if (error) setMessage("❌ " + error.message);
    else setMessage("✅ Settings saved!");
  };

  const updateRole = async (userId, role) => {
    await supabase.from("user_roles").update({ role }).eq("user_id", userId);
    setMessage("✅ Role updated!");
    loadData();
  };

  const downloadBackup = async () => {
    const tables = ["products", "customers", "suppliers", "sales", "sale_items", "settings", "service_jobs"];
    let backup = {};
    for (const t of tables) {
      const { data } = await supabase.from(t).select("*");
      backup[t] = data;
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `backup_${new Date().toISOString().split("T")[0]}.json`; a.click();
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">⚙️ System Settings</h1>
      
      {message && <div className={`p-3 rounded border text-sm ${message.startsWith("✅") ? "bg-green-900/20 border-green-700 text-green-300" : "bg-red-900/20 border-red-700 text-red-300"}`}>{message}</div>}

      <div className="flex gap-2 border-b border-gray-700">
        <button onClick={() => setTab("settings")} className={`px-4 py-2 text-sm font-medium ${tab === "settings" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"}`}>🏪 Shop Settings</button>
        <button onClick={() => setTab("users")} className={`px-4 py-2 text-sm font-medium ${tab === "users" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"}`}>👥 Users</button>
        <button onClick={() => setTab("backup")} className={`px-4 py-2 text-sm font-medium ${tab === "backup" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"}`}>💾 Backup</button>
      </div>

      {tab === "settings" && (
        <div className="bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-400">Shop Name</label><input type="text" value={settings?.shop_name || ""} onChange={e => setSettings({...settings, shop_name: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
            <div><label className="text-xs text-gray-400">Phone</label><input type="text" value={formatPhone(settings?.phone)} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
            <div className="md:col-span-2"><label className="text-xs text-gray-400">Address</label><input type="text" value={settings?.address || ""} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
          </div>
          <h3 className="text-sm font-bold text-blue-400 pt-4 border-t border-gray-800">🏦 Bank Details (For COD)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs text-gray-400">Bank Name</label><input type="text" value={settings?.bank_name || ""} onChange={e => setSettings({...settings, bank_name: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
            <div><label className="text-xs text-gray-400">Account No</label><input type="text" value={settings?.bank_account_no || ""} onChange={e => setSettings({...settings, bank_account_no: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
            <div><label className="text-xs text-gray-400">Account Name</label><input type="text" value={settings?.bank_account_name || ""} onChange={e => setSettings({...settings, bank_account_name: e.target.value})} className="w-full bg-white text-black p-2 rounded text-sm" /></div>
          </div>
          <button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-sm mt-4">💾 Save Settings</button>
        </div>
      )}

      {tab === "users" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-300"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} className="border-b border-gray-800">
                  <td className="p-3 text-white">{u.display_name || "Unknown"}</td>
                  <td className="p-3 text-gray-400">{u.email}</td>
                  <td className="p-3">
                    <select value={u.role} onChange={e => updateRole(u.user_id, e.target.value)} className="bg-white text-black text-xs p-1 rounded">
                      <option value="staff">Staff</option><option value="owner">Owner</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "backup" && (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-center space-y-4">
          <p className="text-gray-300">Database එකේ තියෙන දත්ත JSON ෆයිල් එකක් විදිහට බාගන්න.</p>
          <button onClick={downloadBackup} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold text-sm">⬇️ Download Full Backup</button>
        </div>
      )}
    </div>
  );
}