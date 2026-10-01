import { env } from '../config/env.js';

/**
 * Transactional email via the Resend HTTP API (no SDK dependency — plain fetch).
 * All sends are best-effort: a failed email must never break the API response
 * that triggered it; the error is logged for the operator instead.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

interface SendResult { delivered: boolean; error?: string }

const sendEmail = async (to: string, subject: string, html: string): Promise<SendResult> => {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    console.warn(`[Email] RESEND not configured — skipped "${subject}" to ${to}`);
    return { delivered: false, error: 'not_configured' };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[Email] Resend ${res.status} for "${subject}" to ${to}:`, body);
      return { delivered: false, error: `resend_${res.status}` };
    }
    return { delivered: true };
  } catch (err) {
    console.error(`[Email] Network failure sending "${subject}" to ${to}:`, err);
    return { delivered: false, error: 'network' };
  }
};

const shell = (title: string, bodyHtml: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;border:1px solid #e5e7eb">
    <div style="font-size:18px;font-weight:800;color:#111827;margin-bottom:4px">AgentLab</div>
    <div style="font-size:13px;color:#6b7280;margin-bottom:18px">${title}</div>
    ${bodyHtml}
    <div style="margin-top:22px;font-size:11px;color:#9ca3af">
      Automated email from the AgentLab system — please do not reply directly.
    </div>
  </div>
</div>`;

export const sendLookupOtpEmail = (to: string, code: string, orderId: string) =>
  sendEmail(
    to,
    `Order lookup OTP for ${orderId}: ${code}`,
    shell(
      'Order lookup OTP',
      `<p style="font-size:14px;color:#374151">You requested a lookup code for order
        <strong style="font-family:monospace">${orderId}</strong>. The code is valid for 5 minutes:</p>
       <div style="font-size:30px;font-weight:800;letter-spacing:8px;font-family:monospace;
        color:#111827;background:#f3f4f6;border-radius:10px;padding:14px 0;text-align:center;margin:14px 0">${code}</div>
       <p style="font-size:12px;color:#6b7280">If you did not request this code, please ignore this email.</p>`
    )
  );

export interface OrderEmailData {
  orderId: string;
  productName: string;
  planDurationMonths: number;
  quantity: number;
  totalUSD: number;
  accountEmail?: string | null;
  accountPassword?: string | null;
}

export const sendOrderConfirmationEmail = (to: string, order: OrderEmailData) => {
  const credentialBlock = order.accountEmail
    ? `<div style="margin:14px 0;padding:14px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0">
         <div style="font-size:12px;color:#065f46;font-weight:700;margin-bottom:6px">YOUR ACCOUNT DETAILS</div>
         <div style="font-size:13px;font-family:monospace;color:#111827">Email: ${order.accountEmail}</div>
         <div style="font-size:13px;font-family:monospace;color:#111827">Password: ${order.accountPassword ?? '(see the Orders page)'}</div>
       </div>`
    : `<p style="font-size:13px;color:#374151">Your account is being handed over — track progress on the
        <strong>My Orders</strong> page on AgentLab.</p>`;

  return sendEmail(
    to,
    `Order ${order.orderId} has been confirmed`,
    shell(
      'Order confirmation',
      `<p style="font-size:14px;color:#374151">Thank you! Your order has been paid successfully.</p>
       <table style="width:100%;font-size:13px;color:#374151;margin:12px 0;border-collapse:collapse">
         <tr><td style="padding:4px 0;color:#6b7280">Order ID</td><td style="text-align:right;font-family:monospace">${order.orderId}</td></tr>
         <tr><td style="padding:4px 0;color:#6b7280">Product</td><td style="text-align:right">${order.productName} (${order.planDurationMonths} months x ${order.quantity})</td></tr>
         <tr><td style="padding:4px 0;color:#6b7280">Total</td><td style="text-align:right;font-weight:700">$${order.totalUSD.toFixed(2)} USD</td></tr>
       </table>
       ${credentialBlock}`
    )
  );
};
