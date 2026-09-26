-- Alfiya Mehendi PostgreSQL schema
-- Phase 1: core data model
-- Run this against the application's PostgreSQL database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT,
  google_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50),
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT,
  price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
  shipping_paise BIGINT NOT NULL DEFAULT 0 CHECK (shipping_paise >= 0),
  total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(160) NOT NULL,
  unit_price_paise BIGINT NOT NULL CHECK (unit_price_paise >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_paise BIGINT NOT NULL CHECK (line_total_paise >= 0)
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  level VARCHAR(30) NOT NULL
    CHECK (level IN ('basic', 'intermediate', 'advanced', 'bridal')),
  description TEXT,
  price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'rejected')),
  customer_note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  provider_payment_id VARCHAR(255),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (order_id IS NOT NULL AND booking_id IS NULL)
    OR (order_id IS NULL AND booking_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(booking_date, status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- Initial business categories.
INSERT INTO categories (name, slug, description)
VALUES
  ('Mehendi Powder', 'mehendi-powder', 'Filtered mehendi powders'),
  ('Oils', 'oils', 'Mehendi oils and aftercare oils'),
  ('Tools', 'tools', 'Mehendi application tools'),
  ('Cone & Cellophane Supplies', 'cone-cellophane-supplies', 'Cone paper, cellophane and related supplies')
ON CONFLICT (slug) DO NOTHING;

-- Initial service catalogue.
INSERT INTO services (name, slug, level, description, price_paise)
VALUES
  ('Basic — Palm Arabic Style', 'basic-palm-arabic-style', 'basic', 'Both hands, palm Arabic style.', 25000),
  ('Intermediate — Arm Length', 'intermediate-arm-length', 'intermediate', 'One hand, arm length design.', 50000),
  ('Intermediate — Five Finger Hand', 'intermediate-five-finger-hand', 'intermediate', 'One hand, five-finger design.', 35000),
  ('Advanced — Full Length', 'advanced-full-length', 'advanced', 'One hand, full-length design.', 80000),
  ('Bridal Mehendi', 'bridal-mehendi', 'bridal', 'One hand, bridal mehendi design.', 175000)
ON CONFLICT (slug) DO NOTHING;
