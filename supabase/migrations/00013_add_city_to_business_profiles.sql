-- Add city column to business_profiles table for location tracking
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL;

-- Create index for city-based queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_city ON public.business_profiles(city) WHERE city IS NOT NULL;

-- Comment explaining the column
COMMENT ON COLUMN public.business_profiles.city IS 'City where the business is located';








