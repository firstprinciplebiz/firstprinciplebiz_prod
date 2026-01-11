-- Add referral code columns to student_profiles
ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS referred_by_code TEXT DEFAULT NULL;

-- Add referral code columns to business_profiles  
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS referred_by_code TEXT DEFAULT NULL;

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_referral_code 
ON public.student_profiles(referral_code) WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_profiles_referral_code 
ON public.business_profiles(referral_code) WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_profiles_referred_by 
ON public.student_profiles(referred_by_code) WHERE referred_by_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_profiles_referred_by 
ON public.business_profiles(referred_by_code) WHERE referred_by_code IS NOT NULL;

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(prefix TEXT DEFAULT 'FPB')
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a code like FPB-ABC123
    new_code := prefix || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    
    -- Check if it exists in either table
    SELECT EXISTS(
      SELECT 1 FROM public.student_profiles WHERE referral_code = new_code
      UNION
      SELECT 1 FROM public.business_profiles WHERE referral_code = new_code
    ) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

