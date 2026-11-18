-- Migration 002: Add archive fields to products and services tables
-- This migration adds soft deletion support for products and services
-- Run this migration against the production PostgreSQL database

-- Products table: add deleted_at and deleted_by columns
ALTER TABLE products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Services table: add deleted_at and deleted_by columns
ALTER TABLE services
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for archive queries
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_services_deleted ON services(deleted_at);

-- Ensure existing active products/services have NULL deleted_at
UPDATE products SET deleted_at = NULL WHERE is_active = TRUE AND deleted_at IS NULL;
UPDATE services SET deleted_at = NULL WHERE is_active = TRUE AND deleted_at IS NULL;