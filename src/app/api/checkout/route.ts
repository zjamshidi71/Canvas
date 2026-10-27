import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// POST /api/checkout
// Body: { orderNumber: string }
// Returns: { url: string } — the Stripe-hosted payment page to redirect to.
//
// Teaching note — "never trust the client":
//   The browser only sends the order number. We look up the items in the
//   database and the CURRENT artwork prices ourselves. If we accepted prices
//   from the browser, anyone could open DevTools and buy a $12,000 painting
//   for $1.
// ---------------------------------------------------------------------------
interface OrderItemRow {
  artwork_id: string;
  quantity: number;
}

export async function POST(request: Request) {
  const { orderNumber } = await request.json();
  const origin = new URL(request.url).origin;

  // ---- 1. Load the pending order and its line items ----
  const { data: order } = await getSupabaseAdmin()
    .from("orders")
    .select("email, status, order_items(artwork_id, quantity)")
    .eq("order_number", orderNumber)
    .single();

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "pending") {
    return Response.json({ error: "This order has already been paid." }, { status: 400 });
  }

  const items = order.order_items as OrderItemRow[];

  // ---- 2. Look up real prices from the artworks table ----
  const { data: artworks } = await getSupabaseAdmin()
    .from("artworks")
    .select("id, title, price")
    .in("id", items.map((i) => i.artwork_id));

  if (!artworks || artworks.length !== items.length) {
    return Response.json({ error: "Some artworks are no longer available." }, { status: 400 });
  }

  // ---- 3. Create a Stripe Checkout Session ----
  // Stripe amounts are in the smallest currency unit (cents), so $850 → 85000.
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    line_items: items.map((item) => {
      const artwork = artworks.find((a) => a.id === item.artwork_id)!;
      return {
        quantity: item.quantity,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(Number(artwork.price) * 100),
          product_data: { name: artwork.title },
        },
      };
    }),
    // metadata travels with the payment and comes back to us in the webhook,
    // so we know which order to mark as paid.
    metadata: { orderNumber },
    success_url: `${origin}/checkout/confirmation?order=${orderNumber}`,
    cancel_url: `${origin}/checkout`,
  });

  return Response.json({ url: session.url });
}
