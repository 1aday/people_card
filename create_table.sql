-- Create the people_cards table
CREATE TABLE IF NOT EXISTS public.people_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    profile_photo TEXT,
    linkedin_url TEXT,
    current_role TEXT,
    concise_role TEXT,
    key_achievements JSONB,
    professional_background TEXT,
    career_history JSONB,
    expertise_areas JSONB,
    CONSTRAINT valid_project_name CHECK (char_length(trim(project_name)) > 0)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.people_cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read the data
CREATE POLICY read_people_cards ON public.people_cards
    FOR SELECT TO authenticated
    USING (true);

-- Create policy to allow all authenticated users to insert data
CREATE POLICY insert_people_cards ON public.people_cards
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_people_cards_project_name ON public.people_cards(project_name);
CREATE INDEX IF NOT EXISTS idx_people_cards_created_at ON public.people_cards(created_at); 