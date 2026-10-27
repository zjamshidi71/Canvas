// ---------------------------------------------------------------------------
// Transactional email via Resend (https://resend.com) — SERVER ONLY.
//
// Teaching notes:
//   • We call Resend's REST API with plain fetch(). No SDK needed — an API
//     is just an HTTPS request with a JSON body and an Authorization header.
//   • RESEND_API_KEY has no NEXT_PUBLIC_ prefix, so it never reaches the
//     browser. Anyone with this key could send email as you.
//   • Until you verify your own domain in Resend, the "from" address must be
//     onboarding@resend.dev, and Resend only delivers to the email address
//     you signed up with.
// ---------------------------------------------------------------------------

export interface OrderEmailData {
  orderNumber: string;
  firstName: string;
  email: string;
  total: number;
  items: { title: string; price: number; quantity: number }[];
}

// Artwork titles and names come from users. Escape them so nobody can inject
// HTML (fake links, hidden content) into an email we send.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const money = (amount: number) =>
  amount.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

function buildOrderEmailHtml(order: OrderEmailData): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            ${escapeHtml(item.title)}${item.quantity > 1 ? ` × ${item.quantity}` : ""}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">
            ${money(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-weight:normal;">Thank you, ${escapeHtml(order.firstName)}</h1>
      <p>Your payment was received and your order is confirmed.</p>
      <p style="color:#666;">Order number: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
        ${rows}
        <tr>
          <td style="padding:12px 0;font-weight:bold;">Total paid</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;">${money(order.total)}</td>
        </tr>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#666;">
        The artist will prepare your work for safe shipping. You'll receive
        tracking information once it ships.
      </p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;">— Canvas</p>
    </div>`;
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set — skipping confirmation email.");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Canvas <onboarding@resend.dev>",
      to: order.email,
      subject: `Your Canvas order ${order.orderNumber} is confirmed`,
      html: buildOrderEmailHtml(order),
    }),
  });

  if (!res.ok) {
    console.error("Failed to send confirmation email:", res.status, await res.text());
  }
}
