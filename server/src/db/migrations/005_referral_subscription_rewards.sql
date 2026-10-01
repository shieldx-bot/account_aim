-- Migration 005: Referral subscription rewards
-- Add product_id to track which product the reward is for
-- Add reward_type 'subscription_1month' for 1-month free account reward

ALTER TABLE referral_rewards 
ADD COLUMN IF NOT EXISTS product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL;

-- Update existing reward_type check constraint to include subscription_1month
-- First drop the old constraint if it exists, then add new one
ALTER TABLE referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_reward_type_check;
ALTER TABLE referral_rewards ADD CONSTRAINT referral_rewards_reward_type_check 
  CHECK (reward_type IN ('account_credit_vnd', 'subscription_1month'));

-- Index for querying rewards by product
CREATE INDEX IF NOT EXISTS idx_referral_rewards_product ON referral_rewards(product_id);