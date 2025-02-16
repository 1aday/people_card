-- Add profile_image_options column to people_cards table
ALTER TABLE public.people_cards
ADD COLUMN IF NOT EXISTS profile_image_options JSONB;
