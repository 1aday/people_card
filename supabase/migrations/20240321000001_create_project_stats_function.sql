-- Create function to get project statistics
CREATE OR REPLACE FUNCTION get_project_stats()
RETURNS TABLE (
  project_name text,
  latest_created_at timestamptz,
  card_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.project_name,
    MAX(pc.created_at) as latest_created_at,
    COUNT(*) as card_count
  FROM people_cards pc
  WHERE pc.project_name IS NOT NULL
  GROUP BY pc.project_name
  ORDER BY MAX(pc.created_at) DESC;
END;
$$ LANGUAGE plpgsql; 