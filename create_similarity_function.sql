-- Function to find similar people based on embedding similarity
CREATE OR REPLACE FUNCTION find_similar_people(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  name text,
  current_position text,
  profile_photo text,
  linkedin_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.current_position,
    p.profile_photo,
    p.linkedin_url,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM people_cards p
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 