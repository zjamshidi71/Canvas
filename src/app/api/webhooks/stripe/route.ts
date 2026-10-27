import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
//
// Stripe calls this URL (server-to-server) after a payment succeeds.
//
// Teaching notes:
//   • Why a webhook? The customer might close the tab before returning to
//     our confirmation page. The webhook is the reliable source of truth
//     that money actually moved.
//   • Why verify the signature? This URL is public. Without the check,
//     anyone could POST a fake "payment succeeded" message and get free art.
//   • Why request.text()? The signature is computed over the RAW body.
//     Parsing it as JSON first would change the bytes and break verification.
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature ?? "",
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderNumber = session.metadata?.orderNumber;

    if (session.payment_status === "paid" && orderNumber) {
      const { error } = await getSupabaseAdmin()
        .from("orders")
        .update({ status: "confirmed" })
        .eq("order_number", orderNumber);

      // Returning a 500 tells Stripe to retry the webhook later.
      if (error) {
        console.error("Failed to confirm order:", error);
        return new Response("Database error", { status: 500 });
      }
    }
  }

  // Always acknowledge events we don't handle, or Stripe keeps retrying.
  return Response.json({ received: true });
}
