-- Create issue_interests table
CREATE TABLE IF NOT EXISTS public.issue_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    cover_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_issue_interests_issue_id ON public.issue_interests(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_interests_student_id ON public.issue_interests(student_id);
CREATE INDEX IF NOT EXISTS idx_issue_interests_status ON public.issue_interests(status);

-- Enable Row Level Security
ALTER TABLE public.issue_interests ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own interests
CREATE POLICY "Students can view own interests" ON public.issue_interests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.student_profiles sp
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Policy: Business owners can view interests for their issues
CREATE POLICY "Business owners can view interests for their issues" ON public.issue_interests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.issues i
            JOIN public.business_profiles bp ON bp.id = i.business_id
            WHERE i.id = issue_id AND bp.user_id = auth.uid()
        )
    );

-- Policy: Students can insert their own interest
CREATE POLICY "Students can express interest" ON public.issue_interests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.student_profiles sp
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Policy: Students can update (withdraw) their own interest
CREATE POLICY "Students can withdraw interest" ON public.issue_interests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.student_profiles sp
            WHERE sp.id = student_id AND sp.user_id = auth.uid()
        )
    );

-- Policy: Business owners can update interest status (approve/reject)
CREATE POLICY "Business owners can update interest status" ON public.issue_interests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.issues i
            JOIN public.business_profiles bp ON bp.id = i.business_id
            WHERE i.id = issue_id AND bp.user_id = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_issue_interests_updated_at
    BEFORE UPDATE ON public.issue_interests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
















