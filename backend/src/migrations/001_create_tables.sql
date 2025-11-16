-- Migration: Create initial tables
-- Created: 2025-01-15

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  profile_image_url TEXT,
  profile_image_ipfs_hash VARCHAR(100),
  is_creator BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_creator ON users(is_creator);

-- Table: creator_tokens
CREATE TABLE IF NOT EXISTS creator_tokens (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) UNIQUE NOT NULL,
  creator_address VARCHAR(42) NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  coin_image_url TEXT,
  coin_image_ipfs_hash VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tokens_address ON creator_tokens(token_address);
CREATE INDEX IF NOT EXISTS idx_tokens_creator ON creator_tokens(creator_address);

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  subscriber_address VARCHAR(42) NOT NULL,
  creator_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subscriber_address, creator_address),
  FOREIGN KEY (subscriber_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
  FOREIGN KEY (creator_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_address);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator ON subscriptions(creator_address);

-- Table: user_settings (opcional, para futuras funcionalidades)
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) UNIQUE NOT NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email VARCHAR(255),
  social_links JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_settings_user ON user_settings(user_address);

