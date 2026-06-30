// Invoice printer for property bookings.
// Opens a clean printable invoice in a new window and triggers print.

export type InvoiceBranding = {
  siteTitle: string;
  siteTagline?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type InvoiceBooking = {
  id: string;
  property_title: string;
  property_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  source: string;
  notes?: string | null;
  created_at: string;
};

export type InvoiceExtras = {
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  propertyPrice?: number | null;
  propertyLocation?: string | null;
  currency?: string; // default QAR
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtMoney(amount: number | null | undefined, currency = "QAR") {
  if (amount == null || isNaN(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function printBookingInvoice(
  booking: InvoiceBooking,
  branding: InvoiceBranding,
  extras: InvoiceExtras = {},
) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    alert("Please allow pop-ups to print the invoice.");
    return;
  }
  const currency = extras.currency || "QAR";
  const invoiceNo = `INV-${booking.id.slice(0, 8).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dateStr = new Date(booking.scheduled_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fee = extras.propertyPrice ?? null;
  const reservation = fee != null ? Math.round(fee * 0.05) : 0; // 5% reservation hold (illustrative)
  const subtotal = reservation;
  const tax = 0;
  const total = subtotal + tax;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${esc(invoiceNo)} · ${esc(branding.siteTitle)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#0f172a; margin:0; padding:40px; background:#f8fafc; }
  .sheet { max-width: 800px; margin: 0 auto; background:#fff; padding:48px; border-radius:14px; box-shadow:0 10px 30px rgba(15,23,42,.08); }
  .header { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; border-bottom:2px solid #0f172a; padding-bottom:24px; margin-bottom:32px; }
  .brand { display:flex; align-items:center; gap:14px; }
  .brand img { height:54px; width:auto; object-fit:contain; }
  .brand-name { font-size:22px; font-weight:700; letter-spacing:-0.01em; }
  .brand-tag { font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:.16em; margin-top:2px; }
  .meta { text-align:right; font-size:13px; color:#475569; }
  .meta h1 { margin:0 0 8px; font-size:28px; letter-spacing:-0.02em; color:#0f172a; }
  .meta .row { display:flex; justify-content:space-between; gap:24px; }
  .meta .row span:first-child { color:#94a3b8; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:32px; }
  .card { border:1px solid #e2e8f0; border-radius:10px; padding:16px 18px; }
  .card h3 { margin:0 0 10px; font-size:11px; text-transform:uppercase; letter-spacing:.16em; color:#64748b; font-weight:600; }
  .card p { margin:2px 0; font-size:14px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th, td { text-align:left; padding:12px 10px; font-size:14px; }
  thead th { background:#0f172a; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:.14em; font-weight:600; }
  tbody tr { border-bottom:1px solid #e2e8f0; }
  tbody td.right, th.right { text-align:right; }
  .totals { margin-top:18px; margin-left:auto; width:300px; font-size:14px; }
  .totals .row { display:flex; justify-content:space-between; padding:8px 10px; }
  .totals .row.total { background:#0f172a; color:#fff; border-radius:8px; font-weight:700; font-size:16px; }
  .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.12em; }
  .badge.pending { background:#fef3c7; color:#92400e; }
  .badge.confirmed { background:#dcfce7; color:#166534; }
  .badge.completed { background:#dbeafe; color:#1e40af; }
  .badge.cancelled { background:#fee2e2; color:#991b1b; }
  .notes { margin-top:28px; padding:14px 18px; background:#f1f5f9; border-radius:10px; font-size:13px; color:#334155; }
  .footer { margin-top:36px; padding-top:18px; border-top:1px dashed #cbd5e1; font-size:12px; color:#64748b; display:flex; justify-content:space-between; gap:16px; }
  .footer .thanks { font-weight:600; color:#0f172a; }
  @media print {
    body { padding:0; background:#fff; }
    .sheet { box-shadow:none; border-radius:0; padding:32px; }
    .no-print { display:none !important; }
  }
  .toolbar { max-width:800px; margin:0 auto 16px; display:flex; justify-content:flex-end; gap:8px; }
  .btn { background:#0f172a; color:#fff; border:0; padding:9px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
  .btn.secondary { background:#fff; color:#0f172a; border:1px solid #cbd5e1; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="btn secondary" onclick="window.close()">Close</button>
    <button class="btn" onclick="window.print()">Print / Save PDF</button>
  </div>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        ${branding.logoUrl ? `<img src="${esc(branding.logoUrl)}" alt="" />` : ""}
        <div>
          <div class="brand-name">${esc(branding.siteTitle)}</div>
          ${branding.siteTagline ? `<div class="brand-tag">${esc(branding.siteTagline)}</div>` : ""}
        </div>
      </div>
      <div class="meta">
        <h1>INVOICE</h1>
        <div class="row"><span>Invoice #</span><strong>${esc(invoiceNo)}</strong></div>
        <div class="row"><span>Issued</span><strong>${esc(issueDate)}</strong></div>
        <div class="row"><span>Status</span><span class="badge ${esc(booking.status)}">${esc(booking.status)}</span></div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Billed to</h3>
        <p><strong>${esc(booking.customer_name)}</strong></p>
        <p>${esc(booking.customer_phone)}</p>
        ${booking.customer_email ? `<p>${esc(booking.customer_email)}</p>` : ""}
      </div>
      <div class="card">
        <h3>From</h3>
        <p><strong>${esc(branding.siteTitle)}</strong></p>
        ${branding.address ? `<p>${esc(branding.address)}</p>` : ""}
        ${branding.phone ? `<p>${esc(branding.phone)}</p>` : ""}
        ${branding.email ? `<p>${esc(branding.email)}</p>` : ""}
      </div>
    </div>

    <div class="card" style="margin-bottom:24px;">
      <h3>Viewing details</h3>
      <p><strong>Property:</strong> ${esc(booking.property_title)}</p>
      ${extras.propertyLocation ? `<p><strong>Location:</strong> ${esc(extras.propertyLocation)}</p>` : ""}
      <p><strong>Date:</strong> ${esc(dateStr)} at ${esc(booking.scheduled_time)}</p>
      ${extras.agentName ? `<p><strong>Agent:</strong> ${esc(extras.agentName)}${extras.agentEmail ? ` · ${esc(extras.agentEmail)}` : ""}${extras.agentPhone ? ` · ${esc(extras.agentPhone)}` : ""}</p>` : ""}
      <p><strong>Source:</strong> ${esc(booking.source)}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Property value</th>
          <th class="right">Reservation (5%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            Viewing reservation for <strong>${esc(booking.property_title)}</strong>
            <div style="color:#64748b;font-size:12px;margin-top:4px;">Refundable hold confirmed on viewing</div>
          </td>
          <td class="right">${esc(fmtMoney(fee, currency))}</td>
          <td class="right">${esc(fmtMoney(reservation, currency))}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><strong>${esc(fmtMoney(subtotal, currency))}</strong></div>
      <div class="row"><span>Tax</span><strong>${esc(fmtMoney(tax, currency))}</strong></div>
      <div class="row total"><span>Total due</span><span>${esc(fmtMoney(total, currency))}</span></div>
    </div>

    ${booking.notes ? `<div class="notes"><strong>Notes:</strong> ${esc(booking.notes)}</div>` : ""}

    <div class="footer">
      <div>
        <div class="thanks">Thank you for choosing ${esc(branding.siteTitle)}.</div>
        <div>This invoice was generated on ${esc(issueDate)} and is valid without a signature.</div>
      </div>
      <div style="text-align:right;">
        <div>${esc(branding.siteTitle)}</div>
        ${branding.email ? `<div>${esc(branding.email)}</div>` : ""}
      </div>
    </div>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.focus(); window.print(); }, 350);
    });
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
