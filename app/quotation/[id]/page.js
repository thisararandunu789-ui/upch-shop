"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPhone, fmtMoney, fmtDate } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const BG = "https://ovwyirtkxyzvupjzbjyg.supabase.co/storage/v1/object/public/bill-templates/bill-template_Page_1.png";

export default function QuotationView() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const [qRes, setRes] = await Promise.all([
        supabase.from("quotations").select("*, quotation_items(*, products(item_name, warranty_months))").eq("id", id).single(),
        supabase.from("settings").select("*").eq("id", 1).single()
      ]);
      setData({ q: qRes.data, s: setRes.data });
    }
    if (id) load();
  }, [id]);

  if (!data) return <div className="p-10 text-center">Loading...</div>;

  return (
    <>
      <div className="p-4 no-print bg-gray-900 flex gap-2">
        <button onClick={() => window.print()} className="bg-blue-600 px-4 py-2 rounded text-white text-sm font-bold">🖨️ Print Quotation</button>
        <button onClick={() => router.back()} className="bg-gray-700 px-4 py-2 rounded text-white text-sm">← Back</button>
      </div>
      
      <div className="print-root bg-gray-950 min-h-screen">
        <div className="page">
          <img src={BG} alt="" className="bill-bg" crossOrigin="anonymous" />
          <div className="content">
            <div className="top-header">
              <div className="shop-info">
                <p className="shop-name">{data.s?.shop_name || "UNLIMIT PC HOUSE"}</p>
                {data.s?.address && <p className="shop-address">{data.s.address}</p>}
                {data.s?.phone && <p className="shop-phone">{formatPhone(data.s.phone)}</p>}
              </div>
              <div className="logo-block"></div>
            </div>
            <div className="info-section">
              <div className="info-left">
                <div><label>Name :</label><span className="dots">{data.q.customer_name}</span></div>
                <div><label>Address :</label><span className="dots">{data.q.customer_address}</span></div>
                <div><label>Contact :</label><span className="dots">{formatPhone(data.q.customer_phone)}</span></div>
              </div>
              <div className="info-right">
                <div><label>Quote No :</label><span className="dots">{data.q.quote_no}</span></div>
                <div><label>Date :</label><span className="dots">{fmtDate(data.q.quote_date)}</span></div>
              </div>
            </div>
            <h2 className="invoice-title">QUOTATION</h2>
            <table className="items-table">
              <thead><tr><th className="col-no">No</th><th className="col-desc">Description</th><th className="col-war">War.</th><th className="col-qty">Qty</th><th className="col-price">Unit Price</th><th className="col-amount">Amount</th></tr></thead>
              <tbody>
                {(data.q.quotation_items || []).map((it, i) => (
                  <tr key={i}>
                    <td className="col-no">{String(i + 1).padStart(2, "0")}</td>
                    <td className="col-desc">{it.item_name || it.products?.item_name}</td>
                    <td className="col-war">{it.products?.warranty_months || "-"}</td>
                    <td className="col-qty">{it.qty}</td>
                    <td className="col-price">{fmtMoney(it.unit_price)}</td>
                    <td className="col-amount">{fmtMoney(it.total)}</td>
                  </tr>
                ))}
                <tr className="totals-row"><td colSpan={5} className="label">Sub Total</td><td className="col-amount">{fmtMoney(data.q.subtotal)}</td></tr>
                <tr className="total-row totals-row"><td colSpan={5} className="label">TOTAL</td><td className="col-amount">{fmtMoney(data.q.grand_total)}</td></tr>
              </tbody>
            </table>
            <div className="terms-section mt-4"><h4>Terms & Conditions</h4><p className="plain-note">This quotation is valid for 07 days. 50% advance payment required to confirm the order.</p></div>
            <div className="signature-row mt-auto"><div className="signature-block"><div className="line"></div><div className="label">Authorized Signature</div></div></div>
          </div>
        </div>
      </div>
    </>
  );
}