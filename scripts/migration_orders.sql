-- ============================================================
-- Migration: Add Orders System
-- Canvas Art Gallery
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Orders table — one row per completed purchase
--    Each order stores the buyer's contact info, shipping address,
--    and the total amount paid.
CREATE TABLE IF NOT EXISTS orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number  TEXT NOT NULL UNIQUE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Buyer contact
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,

  -- Shipping address
  address       TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT,
  zip           TEXT NOT NULL,
  country       TEXT NOT NULL,

  -- Financials
  subtotal      NUMERIC(10, 2) NOT NULL,

  -- Status lifecycle: pending → confirmed → shipped → delivered
  status        TEXT NOT NULL DEFAULT 'pending',

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Order items — one row per artwork in an order
--    We intentionally denormalize the title and price here.
--    If an artwork is later deleted or its price changes, the
--    historical order record stays accurate.
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  artwork_id  TEXT NOT NULL,
  title       TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- Row Level Security
-- These policies ensure users can only ever access their own orders,
-- even if someone makes a direct API call with the anon key.
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Logged-in users can create orders linked to their user_id
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can only read their own orders
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add items to their own orders
CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Users can only read items belonging to their own orders
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ============================================================
-- Summary:
--   • orders         — header record for each purchase
--   • order_items    — line items (one per artwork)
--   • RLS            — database-level security (not just UI)
-- ============================================================
