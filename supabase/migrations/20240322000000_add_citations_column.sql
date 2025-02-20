-- Add citations column to people_cards table
ALTER TABLE public.people_cards
ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '{}'::jsonb;

-- Create index for citations column
CREATE INDEX IF NOT EXISTS idx_people_cards_citations ON public.people_cards USING gin(citations);

-- Comment on citations column
COMMENT ON COLUMN public.people_cards.citations IS 'JSON object mapping citation numbers to source URLs'; 