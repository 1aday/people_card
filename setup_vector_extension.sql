-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing embedding column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'people_cards' 
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE people_cards DROP COLUMN embedding;
    END IF;
END $$;

-- Add embedding column with correct dimensions
ALTER TABLE people_cards ADD COLUMN embedding vector(1536); 