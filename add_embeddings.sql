-- Enable the vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to people_cards table
ALTER TABLE public.people_cards
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create a function to generate embeddings
CREATE OR REPLACE FUNCTION generate_person_embedding(
  key_achievements jsonb,
  professional_background text,
  career_history jsonb,
  expertise_areas jsonb
) RETURNS vector
LANGUAGE plpgsql
AS $$
DECLARE
  embedding vector(384);
  combined_text text;
BEGIN
  -- Combine all text data
  combined_text := 
    -- Key achievements
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(key_achievements))
    || ' ' ||
    -- Professional background
    COALESCE(professional_background, '')
    || ' ' ||
    -- Career history
    (SELECT string_agg(
      format('%s at %s (%s). %s',
        history->>'title',
        history->>'company',
        history->>'duration',
        (SELECT string_agg(highlight::text, ' ') 
         FROM jsonb_array_elements_text(history->'highlights') AS highlight)
      ),
      ' '
    ) FROM jsonb_array_elements(career_history) AS history)
    || ' ' ||
    -- Expertise areas
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(expertise_areas));

  -- Call the embedding generation function (this will need to be implemented via Edge Function)
  -- For now, we'll return NULL and update embeddings via application code
  RETURN NULL;
END;
$$;

-- Create a trigger to automatically generate embeddings on insert or update
CREATE OR REPLACE FUNCTION update_person_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.embedding := generate_person_embedding(
    NEW.key_achievements,
    NEW.professional_background,
    NEW.career_history,
    NEW.expertise_areas
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER person_embedding_trigger
BEFORE INSERT OR UPDATE ON people_cards
FOR EACH ROW
EXECUTE FUNCTION update_person_embedding();

-- Create an index for similarity search
CREATE INDEX IF NOT EXISTS people_cards_embedding_idx
ON people_cards
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); 