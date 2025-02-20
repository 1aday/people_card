-- Create a function to update the embedding for a given record
CREATE OR REPLACE FUNCTION update_embedding(p_id bigint, p_embedding float[])
RETURNS void AS $$
BEGIN
  UPDATE people_cards
  SET embedding = p_embedding
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql; 