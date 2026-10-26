import { supabase } from "@/lib/supabase";
import { Order, OrderItem, CartItem } from "@/types";

// ---------------------------------------------------------------------------
// Input type for createOrder — everything the function needs to build
// the order header and its line items.
// ---------------------------------------------------------------------------
export interface CreateOrderInput {
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  items: CartItem[];
  subtotal: number;
}

// ---------------------------------------------------------------------------
// Generate a unique, human-readable order number.
// e.g. "CNV-M3GX9K2A"
// Using Date.now() + random suffix prevents collisions.
// ---------------------------------------------------------------------------
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CNV-${timestamp}${random}`;
}

// ---------------------------------------------------------------------------
// Map a Supabase row (snake_case) → TypeScript Order type (camelCase)
// We do this mapping in one place so the rest of the app uses our clean type.
// ---------------------------------------------------------------------------
function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    orderNumber: row.order_number as string,
    userId: row.user_id as string | null,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    address: row.address as string,
    city: row.city as string,
    state: (row.state as string) ?? "",
    zip: row.zip as string,
    country: row.country as string,
    subtotal: Number(row.subtotal),
    status: row.status as Order["status"],
    createdAt: row.created_at as string,
  };
}

// ========================  C R E A T E  =====================================

/**
 * Save a completed order to the database.
 *
 * This runs two sequential inserts:
 *   1. Insert the order header row (contact, shipping, total)
 *   2. Insert one order_items row for each item in the cart
 *
 * If step 2 fails after step 1 succeeds, the order header exists but
 * has no items. In production you would use a database transaction
 * (or a Supabase Edge Function) to roll both back atomically.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<{ order?: Order; error?: string }> {
  const orderNumber = generateOrderNumber();

  // ---- Step 1: Insert the order header ----
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: input.userId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      country: input.country,
      subtotal: input.subtotal,
      status: "pending",
    })
    .select()
    .single();

  if (orderError || !orderData) {
    console.error("Error creating order:", orderError);
    return { error: orderError?.message ?? "Failed to create order" };
  }

  // ---- Step 2: Insert one row per cart item ----
  const orderItems = input.items.map((cartItem) => ({
    order_id: orderData.id,
    artwork_id: cartItem.artwork.id,
    title: cartItem.artwork.title,
    price: cartItem.artwork.price,
    quantity: cartItem.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    return { error: itemsError.message };
  }

  return { order: mapOrder(orderData) };
}

// ========================  R E A D  =========================================

/**
 * Fetch all orders for the currently logged-in user, newest first.
 * Row Level Security ensures users can never read another user's orders,
 * even if they call this function directly with the anon key.
 */
export async function getOrdersByUser(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (data ?? []).map(mapOrder);
}

/**
 * Fetch a single order with all its line items.
 * Used on the confirmation page to display what was purchased.
 *
 * The nested select "*, order_items(*)" is a Supabase shorthand for a
 * JOIN — it returns the order row plus an array of its child items.
 */
export async function getOrderByNumber(
  orderNumber: string
): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("order_number", orderNumber)
    .single();

  if (error || !data) return null;

  const order = mapOrder(data as Record<string, unknown>);

  // Map the nested order_items array
  order.items = (
    (data as Record<string, unknown[]>).order_items ?? []
  ).map((item) => {
    const r = item as Record<string, unknown>;
    return {
      id: r.id as string,
      orderId: r.order_id as string,
      artworkId: r.artwork_id as string,
      title: r.title as string,
      price: Number(r.price),
      quantity: r.quantity as number,
    } satisfies OrderItem;
  });

  return order;
}

/**
 * Admin only — fetch all orders across all users.
 * This only works with the service role key (server-side).
 * With the anon key, RLS will return an empty array for non-admin users.
 */
export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }

  return (data ?? []).map(mapOrder);
}
