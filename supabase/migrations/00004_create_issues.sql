-- Create issues table
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expectations TEXT,
    compensation_type TEXT NOT NULL CHECK (compensation_type IN ('paid', 'voluntary', 'negotiable')),
    compensation_amount DECIMAL(10, 2),
    duration_days INTEGER,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
    required_skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_issues_business_id ON public.issues(business_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_compensation_type ON public.issues(compensation_type);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_required_skills ON public.issues USING GIN(required_skills);

-- Enable Row Level Security
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view open issues
CREATE POLICY "Open issues are viewable by everyone" ON public.issues
    FOR SELECT USING (true);

-- Policy: Business owners can insert issues
CREATE POLICY "Business owners can create issues" ON public.issues
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.business_profiles bp
            WHERE bp.id = business_id AND bp.user_id = auth.uid()
        )
    );

-- Policy: Business owners can update their own issues
CREATE POLICY "Business owners can update own issues" ON public.issues
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.business_profiles bp
            WHERE bp.id = business_id AND bp.user_id = auth.uid()
        )
    );

-- Policy: Business owners can delete their own issues
CREATE POLICY "Business owners can delete own issues" ON public.issues
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.business_profiles bp
            WHERE bp.id = business_id AND bp.user_id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();














