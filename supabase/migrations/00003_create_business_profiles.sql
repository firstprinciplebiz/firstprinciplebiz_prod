-- Create business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    phone TEXT,
    business_name TEXT NOT NULL,
    business_description TEXT,
    industry TEXT NOT NULL,
    address TEXT,
    business_age_years INTEGER,
    avatar_url TEXT,
    looking_for JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_industry ON public.business_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_business_profiles_looking_for ON public.business_profiles USING GIN(looking_for);

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view business profiles
CREATE POLICY "Business profiles are viewable by everyone" ON public.business_profiles
    FOR SELECT USING (true);

-- Policy: Business owners can insert their own profile
CREATE POLICY "Business owners can insert own profile" ON public.business_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Business owners can update their own profile
CREATE POLICY "Business owners can update own profile" ON public.business_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_business_profiles_updated_at
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
















