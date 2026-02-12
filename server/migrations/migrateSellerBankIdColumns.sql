-- Migration: Add bank and ID columns to sellers table
ALTER TABLE sellers
  ADD COLUMN bank_name VARCHAR(100),
  ADD COLUMN account_holder VARCHAR(100),
  ADD COLUMN account_number VARCHAR(50),
  ADD COLUMN routing_number VARCHAR(50),
  ADD COLUMN government_id VARCHAR(100),
  ADD COLUMN id_number VARCHAR(100);
