"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPhone, fmtMoney, fmtDate, fmtWarranty } from "@/lib/utils";

// 🆕 මේ පේළිය අනිවාර්යයෙන් එකතු කරන්න
export const dynamic = 'force-dynamic'; 

const FALLBACK_BG = "https://ovwyirtkxyzvupjzbjyg.supabase.co/storage/v1/object/public/bill-templates/bill-template_Page_1.png";

export default function BillPage() {
// ... ඉතුරු කෝඩ් එක එහෙම්මම තියන්න
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [saleRes, settingsRes] = await Promise.all([
        supabase.from("sales").select("*, customers(*), sale_items(*, products(item_code, item_name, warranty_months), services(service_name)), trade_ins(*)").eq("id", id).single(),
        supabase.from("settings").select("*").eq("id", 1).single()
      ]);
      if (saleRes.data) setData({ sale: saleRes.data, settings: settingsRes.data });
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading Bill...</div>;
  if (!data) return <div className="p-10 text-center text-red-400">Sale not found.</div>;

  const { sale, settings } = data;
  const items = sale.sale_items || [];
  const tradeIns = sale.trade_ins || [];
  
  // ගණනය කිරීම්
  const itemDiscTotal = items.reduce((sum, it) => sum + (Number(it.discount) || 0), 0);
  const tradeInTotal = tradeIns.reduce((sum, t) => sum + Number(t.trade_in_value || 0), 0);
  const actualDiscount = Math.max(0, Number(sale.discount || 0) - tradeInTotal);

  const getItemName = (item) => {
    if (item.service_id) return item.services?.service_name || "Service";
    return item.products?.item_name || "Unknown Product";
  };

  // බිල්පතේ ඇති Item ගණන අනුව Row Height එක සකස් කිරීම
  const itemsCount = Math.max(1, items.length + tradeIns.length);
  const autoPadY = Math.max(4, Math.round((320 / itemsCount - 22) / 2));

  return (
    <>
      {/* ක්‍රියාකාරී බොත්තම් (Print කරද්දී පේන්නේ නෑ) */}
      <div className="p-4 md:p-6 no-print bg-gray-900 flex flex-wrap gap-3 sticky top-0 z-10 border-b border-gray-800">
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium text-sm transition">🖨️ Print Bill</button>
        <button onClick={() => router.back()} className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded font-medium text-sm transition">← Back</button>
      </div>

      {/* බිල්පත පෙන්වන ප්‍රධාන කොටස */}
      <div className="print-root bg-gray-950 min-h-screen">
        <div className="page">
          <img src={settings?.bill_bg_url_1 || FALLBACK_BG} alt="" className="bill-bg" crossOrigin="anonymous" />
          
          <div className="content">
            {/* Header */}
            <div className="top-header">
              <div className="shop-info">
                <p className="shop-name">{settings?.shop_name || "UNLIMIT PC HOUSE"}</p>
                {settings?.address && <p className="shop-address">{settings.address}</p>}
                {settings?.phone && <p className="shop-phone">{formatPhone(settings.phone)}</p>}
              </div>
              <div className="logo-block"></div>
            </div>

            {/* Customer & Invoice Info */}
            <div className="info-section">
              <div className="info-left">
                <div><label>Name :</label><span className="dots">{sale.customers?.customer_name || "Walk-in Customer"}</span></div>
                <div><label>Address :</label><span className="dots">{sale.customers?.address || ""}</span></div>
                <div><label>Contact No :</label><span className="dots">{sale.customers?.phone ? formatPhone(sale.customers.phone) : ""}</span></div>
                <div><label>ID No :</label><span className="dots"></span></div>
              </div>
              <div className="info-right">
                <div><label>Invoice No :</label><span className="dots">{sale.invoice_no}</span></div>
                <div><label>Invoice Date :</label><span className="dots">{fmtDate(sale.sale_date)}</span></div>
              </div>
            </div>

            <h2 className="invoice-title">INVOICE</h2>

            {/* Items Table */}
            <table className="items-table">
              <thead>
                <tr>
                  <th className="col-no">No</th>
                  <th className="col-desc">Description</th>
                  <th className="col-war">War.</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-price">Unit Price</th>
                  <th className="col-amount">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {/* සාමාන්‍ය භාණ්ඩ සහ සේවා */}
                {items.map((item, i) => {
                  const isService = !!item.service_id;
                  const itemNet = Number(item.total) - (Number(item.discount) || 0);
                  return (
                    <tr key={item.id}>
                      <td className="col-no" style={{ padding: `${autoPadY}px 6px` }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="col-desc" style={{ padding: `${autoPadY}px 6px` }}>
                        {getItemName(item)} {isService && <span className="text-[9px] opacity-70">(Service)</span>}
                      </td>
                      <td className="col-war" style={{ padding: `${autoPadY}px 6px` }}>
                        {isService ? "N/A" : fmtWarranty(item.products?.warranty_months)}
                      </td>
                      <td className="col-qty" style={{ padding: `${autoPadY}px 6px` }}>{String(item.qty).padStart(2, "0")}</td>
                      <td className="col-price" style={{ padding: `${autoPadY}px 6px` }}>{fmtMoney(item.unit_price)}</td>
                      <td className="col-amount" style={{ padding: `${autoPadY}px 6px` }}>{fmtMoney(itemNet)}</td>
                    </tr>
                  );
                })}

                {/* Trade-ins */}
                {tradeIns.map((t, i) => (
                  <tr key={`trade-${t.id}`} style={{ color: "#1d4ed8" }}>
                    <td className="col-no" style={{ padding: `${autoPadY}px 6px` }}>{String(items.length + i + 1).padStart(2, "0")}</td>
                    <td className="col-desc" style={{ padding: `${autoPadY}px 6px` }}>🔄 Trade-in: {t.product_name}</td>
                    <td className="col-war" style={{ padding: `${autoPadY}px 6px` }}>-</td>
                    <td className="col-qty" style={{ padding: `${autoPadY}px 6px` }}>01</td>
                    <td className="col-price" style={{ padding: `${autoPadY}px 6px` }}>({fmtMoney(t.trade_in_value)})</td>
                    <td className="col-amount" style={{ padding: `${autoPadY}px 6px` }}>({fmtMoney(t.trade_in_value)})</td>
                  </tr>
                ))}

                {/* Totals */}
                <tr className="totals-row">
                  <td colSpan={5} className="label">Sub Total</td>
                  <td className="col-amount">{fmtMoney(sale.subtotal)}</td>
                </tr>
                
                {itemDiscTotal > 0 && (
                  <tr className="totals-row">
                    <td colSpan={5} className="label">Item Discount</td>
                    <td className="col-amount">- {fmtMoney(itemDiscTotal)}</td>
                  </tr>
                )}

                {actualDiscount > 0 && (
                  <tr className="totals-row">
                    <td colSpan={5} className="label">Discount</td>
                    <td className="col-amount">- {fmtMoney(actualDiscount)}</td>
                  </tr>
                )}

                {tradeInTotal > 0 && (
                  <tr className="totals-row">
                    <td colSpan={5} className="label" style={{ color: "#1d4ed8" }}>Trade-in Deduction</td>
                    <td className="col-amount" style={{ color: "#1d4ed8" }}>- {fmtMoney(tradeInTotal)}</td>
                  </tr>
                )}

                <tr className="total-row totals-row">
                  <td colSpan={5} className="label">TOTAL</td>
                  <td className="col-amount">{fmtMoney(sale.grand_total)}</td>
                </tr>
              </tbody>
            </table>

            <br />

            {/* Terms & Conditions */}
            <div className="terms-section">
              <h4>Term &amp; Conditions</h4>
              <div className="term-line"><span className="check">✓</span><span className="italic-note">To warranty claim need this invoice.</span></div>
              <div className="term-line"><span className="check">✓</span><span className="italic-note">Please read terms &amp; conditions in next page.</span></div>
              <p className="plain-note">I have received the above goods in working condition. I have read and accept all warranty terms &amp; conditions mentioned.</p>
            </div>

            {/* Signatures */}
            <div className="signature-row">
              <div className="signature-block"><div className="line"></div><div className="label">Customer Signature &amp; Date</div></div>
              <div className="signature-block"><div className="line"></div><div className="label">Authorized Signature &amp; Date</div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}