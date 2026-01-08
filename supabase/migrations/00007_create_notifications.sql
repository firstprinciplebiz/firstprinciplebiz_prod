-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_interest', 'interest_approved', 'interest_rejected', 'new_message', 'new_issue')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert notifications (via service role)
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Policy: Users can mark their notifications as read
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Function to create notification (for triggers)
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new interest notification
CREATE OR REPLACE FUNCTION notify_new_interest()
RETURNS TRIGGER AS $$
DECLARE
    business_user_id UUID;
    student_name TEXT;
    issue_title TEXT;
BEGIN
    -- Get the business owner's user_id
    SELECT bp.user_id, i.title INTO business_user_id, issue_title
    FROM public.issues i
    JOIN public.business_profiles bp ON bp.id = i.business_id
    WHERE i.id = NEW.issue_id;
    
    -- Get student name
    SELECT full_name INTO student_name
    FROM public.student_profiles
    WHERE id = NEW.student_id;
    
    -- Create notification
    PERFORM create_notification(
        business_user_id,
        'new_interest',
        'New Interest in Your Issue',
        student_name || ' is interested in "' || issue_title || '"',
        jsonb_build_object('issue_id', NEW.issue_id, 'student_id', NEW.student_id, 'interest_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new interest
CREATE TRIGGER on_new_interest
    AFTER INSERT ON public.issue_interests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_interest();

-- Trigger function for interest status change
CREATE OR REPLACE FUNCTION notify_interest_status_change()
RETURNS TRIGGER AS $$
DECLARE
    student_user_id UUID;
    issue_title TEXT;
    notification_type TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Only notify if status changed to approved or rejected
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;
    
    IF NEW.status NOT IN ('approved', 'rejected') THEN
        RETURN NEW;
    END IF;
    
    -- Get student's user_id and issue title
    SELECT sp.user_id, i.title INTO student_user_id, issue_title
    FROM public.student_profiles sp
    JOIN public.issues i ON i.id = NEW.issue_id
    WHERE sp.id = NEW.student_id;
    
    IF NEW.status = 'approved' THEN
        notification_type := 'interest_approved';
        notification_title := 'Interest Approved!';
        notification_message := 'Your interest in "' || issue_title || '" has been approved!';
    ELSE
        notification_type := 'interest_rejected';
        notification_title := 'Interest Not Selected';
        notification_message := 'Your interest in "' || issue_title || '" was not selected.';
    END IF;
    
    -- Create notification
    PERFORM create_notification(
        student_user_id,
        notification_type,
        notification_title,
        notification_message,
        jsonb_build_object('issue_id', NEW.issue_id, 'interest_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for interest status change
CREATE TRIGGER on_interest_status_change
    AFTER UPDATE ON public.issue_interests
    FOR EACH ROW
    EXECUTE FUNCTION notify_interest_status_change();
















