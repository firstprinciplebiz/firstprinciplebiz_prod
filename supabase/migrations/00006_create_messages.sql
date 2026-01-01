-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_issue_id ON public.messages(issue_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages (sent or received)
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Policy: Users can send messages
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy: Users can mark messages as read (receiver only)
CREATE POLICY "Users can mark messages as read" ON public.messages
    FOR UPDATE USING (
        auth.uid() = receiver_id
    );

-- Create function to get conversations
CREATE OR REPLACE FUNCTION get_conversations(user_uuid UUID)
RETURNS TABLE (
    participant_id UUID,
    participant_name TEXT,
    participant_avatar TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT,
    issue_id UUID,
    issue_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH conversation_partners AS (
        SELECT DISTINCT
            CASE 
                WHEN sender_id = user_uuid THEN receiver_id
                ELSE sender_id
            END AS partner_id
        FROM public.messages
        WHERE sender_id = user_uuid OR receiver_id = user_uuid
    ),
    latest_messages AS (
        SELECT DISTINCT ON (
            LEAST(m.sender_id, m.receiver_id),
            GREATEST(m.sender_id, m.receiver_id)
        )
            CASE 
                WHEN m.sender_id = user_uuid THEN m.receiver_id
                ELSE m.sender_id
            END AS partner_id,
            m.content AS last_msg,
            m.created_at AS last_msg_at,
            m.issue_id AS msg_issue_id
        FROM public.messages m
        WHERE m.sender_id = user_uuid OR m.receiver_id = user_uuid
        ORDER BY
            LEAST(m.sender_id, m.receiver_id),
            GREATEST(m.sender_id, m.receiver_id),
            m.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            sender_id AS partner_id,
            COUNT(*) AS unread
        FROM public.messages
        WHERE receiver_id = user_uuid AND is_read = FALSE
        GROUP BY sender_id
    )
    SELECT 
        lm.partner_id,
        COALESCE(sp.full_name, bp.owner_name) AS participant_name,
        COALESCE(sp.avatar_url, bp.avatar_url) AS participant_avatar,
        lm.last_msg,
        lm.last_msg_at,
        COALESCE(uc.unread, 0),
        lm.msg_issue_id,
        i.title AS issue_title
    FROM latest_messages lm
    LEFT JOIN public.users u ON u.id = lm.partner_id
    LEFT JOIN public.student_profiles sp ON sp.user_id = lm.partner_id
    LEFT JOIN public.business_profiles bp ON bp.user_id = lm.partner_id
    LEFT JOIN public.issues i ON i.id = lm.msg_issue_id
    LEFT JOIN unread_counts uc ON uc.partner_id = lm.partner_id
    ORDER BY lm.last_msg_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;













