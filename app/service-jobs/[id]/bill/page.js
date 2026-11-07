"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPhone, fmtMoney, fmtDate } from "@/lib/utils";

const BG = "https://ovwyirtkxyzvupjzbjyg.supabase.co/storage/v1/object/public/bill-templates/bill-template_Page_1.png";

export default function ServiceBill() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const [jRes, pRes, setRes] = await Promise.all([
        supabase.from("service_jobs").select("*").eq("id", id).single(),
        supabase.from("service_job_parts").select("*").eq("job_id", id),
        supabase.from("settings").select("*").eq("id", 1).single()
      ]);
      setData({ job: jRes.data, parts: pRes.data || [], s: setRes.data });
    }
    if (id) load();
  }, [id]);

  if (!data) return <div className="p-10 text-center">Loading...</div>;

  const { job, parts, s } = data;
  const total = Number(job.service_charge || 0) + parts.reduce((sum, p) => sum + Number(p.total), 0) - Number(job.discount || 0);

  return (
    <>
      <div className="p-4 no-print bg-gray-900 flex gap-2">
        <button onClick={() => window.print()} className="bg-blue-600 px-4 py-2 rounded text-white text-sm font-bold">🖨️ Print Service Bill</button>
        <button onClick={() => router.back()} className="bg-gray-700 px-4 py-2 rounded text-white text-sm">← Back</button>
      </div>
      
      <div className="print-root bg-gray-950 min-h-screen">
        <div className="page">
          <img src={BG} alt="" className="bill-bg" crossOrigin="anonymous" />
          <div className="content">
            <div className="top-header">
              <div className="shop-info">
                <p className="shop-name">{s?.shop_name || "UNLIMIT PC HOUSE"}</p>
                {s?.address && <p className="shop-address">{s.address}</p>}
              </div>
              <div className="logo-block"></div>
            </div>
            <div className="info-section">
              <div className="info-left">
                <div><label>Name :</label><span className="dots">{job.customer_name}</span></div>
                <div><label>Phone :</label><span className="dots">{formatPhone(job.phone)}</span></div>
                <div><label>Device :</label><span className="dots">{job.device_type} {job.brand} {job.model}</span></div>
              </div>
              <div className="info-right">
                <div><label>Bill No :</label><span className="dots">{job.job_no}</span></div>
                <div><label>Date :</label><span className="dots">{fmtDate(job.delivered_date || job.received_date)}</span></div>
              </div>
            </div>
            <h2 className="invoice-title">SERVICE BILL</h2>
            <table className="items-table">
              <thead><tr><th className="col-no">No</th><th className="col-desc">Description</th><th className="col-qty">Qty</th><th className="col-price">Unit Price</th><th className="col-amount">Amount</th></tr></thead>
              <tbody>
                <tr><td className="col-no">01</td><td className="col-desc">Service Charge</td><td className="col-qty">01</td><td className="col-price">{fmtMoney(job.service_charge)}</td><td className="col-amount">{fmtMoney(job.service_charge)}</td></tr>
                {parts.map((p, i) => (
                  <tr key={p.id}>
                    <td className="col-no">{String(i + 2).padStart(2, "0")}</td>
                    <td className="col-desc">{p.product_name}</td>
                    <td className="col-qty">{p.qty}</td>
                    <td className="col-price">{fmtMoney(p.unit_price)}</td>
                    <td className="col-amount">{fmtMoney(p.total)}</td>
                  </tr>
                ))}
                <tr className="total-row totals-row"><td colSpan={4} className="label">TOTAL</td><td className="col-amount">{fmtMoney(total)}</td></tr>
              </tbody>
            </table>
            <div className="signature-row mt-auto"><div className="signature-block"><div className="line"></div><div className="label">Authorized Signature</div></div></div>
          </div>
        </div>
      </div>
    </>
  );
}