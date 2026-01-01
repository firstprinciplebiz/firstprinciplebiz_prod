-- Create student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    university_name TEXT NOT NULL,
    degree_name TEXT NOT NULL,
    major TEXT NOT NULL,
    degree_level TEXT NOT NULL CHECK (degree_level IN ('undergraduate', 'masters', 'doctorate', 'other')),
    bio TEXT,
    avatar_url TEXT,
    areas_of_interest JSONB DEFAULT '[]'::jsonb,
    expertise JSONB DEFAULT '[]'::jsonb,
    open_to_paid BOOLEAN DEFAULT TRUE,
    open_to_voluntary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_areas_of_interest ON public.student_profiles USING GIN(areas_of_interest);
CREATE INDEX IF NOT EXISTS idx_student_profiles_expertise ON public.student_profiles USING GIN(expertise);

-- Enable Row Level Security
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view student profiles
CREATE POLICY "Student profiles are viewable by everyone" ON public.student_profiles
    FOR SELECT USING (true);

-- Policy: Students can insert their own profile
CREATE POLICY "Students can insert own profile" ON public.student_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Students can update their own profile
CREATE POLICY "Students can update own profile" ON public.student_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();













