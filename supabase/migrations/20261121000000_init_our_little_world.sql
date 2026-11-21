-- ==============================================================================
-- PROJECT: Our Little World ♡ ("Us ♡")
-- DATABASE MIGRATION: Initial Schema & Security Policies
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with public profile metadata
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT '',
    nickname TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    birthday DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. COUPLE SPACES TABLE
-- The shared private realm belonging exclusively to the paired couple
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.couple_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Our Little World',
    relationship_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    widget_access_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.couple_spaces ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. COUPLE MEMBERS TABLE
-- Links exactly two users to a couple space
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.couple_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('creator', 'partner')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_per_space UNIQUE(space_id, user_id)
);

ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

-- Enforce exactly maximum 2 members per couple space
CREATE OR REPLACE FUNCTION public.check_max_couple_members()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count 
    FROM public.couple_members 
    WHERE space_id = NEW.space_id;

    IF current_count >= 2 THEN
        RAISE EXCEPTION 'A couple space can have at most 2 members.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_couple_members ON public.couple_members;
CREATE TRIGGER trg_check_max_couple_members
    BEFORE INSERT ON public.couple_members
    FOR EACH ROW
    EXECUTE FUNCTION public.check_max_couple_members();

-- Helper function: check if a user is a member of a space
CREATE OR REPLACE FUNCTION public.is_space_member(p_space_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.couple_members
        WHERE space_id = p_space_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 4. INVITATIONS TABLE
-- Secure, single-use, time-limited invitations for couple pairing
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    invitation_code TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '30 days'),
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. PHOTOS TABLE
-- Shared photo album storing couple memories and metadata
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    taken_at TIMESTAMPTZ,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_photos_space_created ON public.photos(space_id, created_at DESC);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. PHOTO ROTATION TABLE
-- Tracks the current hourly photo so both users and widgets see the same photo
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_rotation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID UNIQUE NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    current_photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
    previous_photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
    rotation_slot TEXT NOT NULL, -- Format: 'YYYY-MM-DD-HH24'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.photo_rotation ENABLE ROW LEVEL SECURITY;

-- Hourly photo rotation deterministic engine
CREATE OR REPLACE FUNCTION public.get_or_rotate_current_photo(p_space_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_slot TEXT;
    rec_rotation RECORD;
    selected_photo RECORD;
    photo_count INT;
BEGIN
    current_slot := to_char(timezone('utc'::text, now()), 'YYYY-MM-DD-HH24');
    
    SELECT * INTO rec_rotation FROM public.photo_rotation WHERE space_id = p_space_id;
    
    -- Count available photos for this couple space
    SELECT count(*) INTO photo_count FROM public.photos WHERE space_id = p_space_id;
    
    IF photo_count = 0 THEN
        RETURN NULL;
    END IF;

    -- If rotation exists and slot matches current hour, return current photo
    IF rec_rotation.id IS NOT NULL AND rec_rotation.rotation_slot = current_slot AND rec_rotation.current_photo_id IS NOT NULL THEN
        SELECT p.*, prof.nickname as uploader_nickname, prof.full_name as uploader_name
        INTO selected_photo
        FROM public.photos p
        LEFT JOIN public.profiles prof ON prof.id = p.uploaded_by
        WHERE p.id = rec_rotation.current_photo_id;

        IF selected_photo.id IS NOT NULL THEN
            RETURN to_jsonb(selected_photo);
        END IF;
    END IF;

    -- Else: Time to rotate or initialize! Avoid immediately previous photo if photo_count > 1
    IF photo_count > 1 AND rec_rotation.current_photo_id IS NOT NULL THEN
        SELECT p.*, prof.nickname as uploader_nickname, prof.full_name as uploader_name
        INTO selected_photo
        FROM public.photos p
        LEFT JOIN public.profiles prof ON prof.id = p.uploaded_by
        WHERE p.space_id = p_space_id AND p.id <> rec_rotation.current_photo_id
        ORDER BY random()
        LIMIT 1;
    ELSE
        SELECT p.*, prof.nickname as uploader_nickname, prof.full_name as uploader_name
        INTO selected_photo
        FROM public.photos p
        LEFT JOIN public.profiles prof ON prof.id = p.uploaded_by
        WHERE p.space_id = p_space_id
        ORDER BY random()
        LIMIT 1;
    END IF;

    -- Upsert rotation record
    IF selected_photo.id IS NOT NULL THEN
        INSERT INTO public.photo_rotation (space_id, current_photo_id, previous_photo_id, rotation_slot, updated_at)
        VALUES (p_space_id, selected_photo.id, rec_rotation.current_photo_id, current_slot, timezone('utc'::text, now()))
        ON CONFLICT (space_id) DO UPDATE SET
            previous_photo_id = EXCLUDED.previous_photo_id,
            current_photo_id = EXCLUDED.current_photo_id,
            rotation_slot = EXCLUDED.rotation_slot,
            updated_at = EXCLUDED.updated_at;
            
        RETURN to_jsonb(selected_photo);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 7. MOODS TABLE
-- Daily mood check-ins with emoji, labels, and optional personal note
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    mood_label TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_moods_space_user ON public.moods(space_id, user_id, created_at DESC);
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 8. MESSAGES TABLE
-- Private chat and quick predefined loving notes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_quick_message BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_space_created ON public.messages(space_id, created_at ASC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 9. DAILY QUESTIONS TABLE
-- Curated shared questions for every day of the year
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    day_index INTEGER UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'romance',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 10. QUESTION ANSWERS TABLE
-- Stored answers. Note: partner answer is hidden until both have answered!
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.daily_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    answered_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_daily_answer UNIQUE(space_id, question_id, user_id, answered_date)
);

CREATE INDEX IF NOT EXISTS idx_answers_space_date ON public.question_answers(space_id, answered_date DESC);
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 11. LOCATION UPDATES & HISTORY
-- Current foreground location updates with consent and distance calculation
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.location_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 0,
    is_sharing_paused BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_location UNIQUE(space_id, user_id)
);

ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 12. VIRTUAL INTERACTIONS TABLE
-- Hugs, Kisses, Forehead kisses, Hearts, Cuddles, Bear hugs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.virtual_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('hug', 'kiss', 'forehead_kiss', 'heart', 'cuddle', 'bear_hug')),
    message TEXT DEFAULT '',
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_interactions_space_created ON public.virtual_interactions(space_id, created_at DESC);
ALTER TABLE public.virtual_interactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 13. SPECIAL DATES TABLE
-- Anniversaries, birthdays, trips, and milestone countdowns
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.special_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    is_annual BOOLEAN NOT NULL DEFAULT true,
    icon TEXT NOT NULL DEFAULT 'heart',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 14. NOTIFICATION PREFERENCES TABLE
-- Web push and alert preferences
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enable_mood_alerts BOOLEAN NOT NULL DEFAULT true,
    enable_message_alerts BOOLEAN NOT NULL DEFAULT true,
    enable_interaction_alerts BOOLEAN NOT NULL DEFAULT true,
    enable_question_alerts BOOLEAN NOT NULL DEFAULT true,
    web_push_subscription JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, nickname)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email;

    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- PROFILES
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- COUPLE SPACES
CREATE POLICY "Users can view couple spaces they belong to"
    ON public.couple_spaces FOR SELECT
    TO authenticated
    USING (public.is_space_member(id, auth.uid()));

CREATE POLICY "Users can create couple spaces"
    ON public.couple_spaces FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can update their couple space"
    ON public.couple_spaces FOR UPDATE
    TO authenticated
    USING (public.is_space_member(id, auth.uid()));

-- COUPLE MEMBERS
CREATE POLICY "Users can view members of their couple space"
    ON public.couple_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR 
        public.is_space_member(space_id, auth.uid())
    );

CREATE POLICY "Authenticated users can join couple spaces via invite or creation"
    ON public.couple_members FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- INVITATIONS
CREATE POLICY "Members can view invitations for their space"
    ON public.invitations FOR SELECT
    TO authenticated
    USING (
        public.is_space_member(space_id, auth.uid()) OR
        is_used = false -- Allows potential joiner to lookup by code
    );

CREATE POLICY "Members can create invitations"
    ON public.invitations FOR INSERT
    TO authenticated
    WITH CHECK (public.is_space_member(space_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Invitations can be updated when redeemed"
    ON public.invitations FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- PHOTOS
CREATE POLICY "Members can view photos in their space"
    ON public.photos FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can upload photos to their space"
    ON public.photos FOR INSERT
    TO authenticated
    WITH CHECK (public.is_space_member(space_id, auth.uid()) AND uploaded_by = auth.uid());

CREATE POLICY "Members can update photo metadata (e.g. favorite, caption)"
    ON public.photos FOR UPDATE
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can delete their own uploaded photos"
    ON public.photos FOR DELETE
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()) AND uploaded_by = auth.uid());

-- PHOTO ROTATION
CREATE POLICY "Members can view photo rotation"
    ON public.photo_rotation FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can update photo rotation"
    ON public.photo_rotation FOR ALL
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

-- MOODS
CREATE POLICY "Members can view moods in their space"
    ON public.moods FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can post their mood"
    ON public.moods FOR INSERT
    TO authenticated
    WITH CHECK (public.is_space_member(space_id, auth.uid()) AND user_id = auth.uid());

-- MESSAGES
CREATE POLICY "Members can view messages in their space"
    ON public.messages FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can send messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (public.is_space_member(space_id, auth.uid()) AND sender_id = auth.uid());

-- DAILY QUESTIONS
CREATE POLICY "Daily questions are viewable by authenticated users"
    ON public.daily_questions FOR SELECT
    TO authenticated
    USING (true);

-- QUESTION ANSWERS: Reveal logic!
-- You can view your own answer OR your partner's answer IF you have answered this question yourself!
CREATE POLICY "Question answers viewable with mutual reveal"
    ON public.question_answers FOR SELECT
    TO authenticated
    USING (
        public.is_space_member(space_id, auth.uid()) AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.question_answers self_ans
                WHERE self_ans.space_id = question_answers.space_id
                  AND self_ans.question_id = question_answers.question_id
                  AND self_ans.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Members can insert their own question answers"
    ON public.question_answers FOR INSERT
    TO authenticated
    WITH CHECK (public.is_space_member(space_id, auth.uid()) AND user_id = auth.uid());

-- LOCATION UPDATES
CREATE POLICY "Members can view locations in their space"
    ON public.location_updates FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can update their own location"
    ON public.location_updates FOR ALL
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()) AND user_id = auth.uid())
    WITH CHECK (public.is_space_member(space_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Members can view location history"
    ON public.location_history FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can insert location history"
    ON public.location_history FOR INSERT
    TO authenticated
    WITH CHECK (public.is_space_member(space_id, auth.uid()));

-- VIRTUAL INTERACTIONS
CREATE POLICY "Members can view interactions"
    ON public.virtual_interactions FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can send interactions"
    ON public.virtual_interactions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_space_member(space_id, auth.uid()) AND sender_id = auth.uid());

CREATE POLICY "Members can mark interactions as opened"
    ON public.virtual_interactions FOR UPDATE
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

-- SPECIAL DATES
CREATE POLICY "Members can view special dates"
    ON public.special_dates FOR SELECT
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()));

CREATE POLICY "Members can manage special dates"
    ON public.special_dates FOR ALL
    TO authenticated
    USING (public.is_space_member(space_id, auth.uid()))
    WITH CHECK (public.is_space_member(space_id, auth.uid()));

-- NOTIFICATION PREFERENCES
CREATE POLICY "Users can manage their notification preferences"
    ON public.notification_preferences FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- WIDGET SNAPSHOT FUNCTION (Called by Scriptable iOS Widget via RPC)
-- Uses widget_access_token to fetch consolidated data in ONE single request!
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_widget_snapshot(p_widget_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_space RECORD;
    v_member_1 RECORD;
    v_member_2 RECORD;
    v_mood_1 RECORD;
    v_mood_2 RECORD;
    v_photo JSONB;
    v_loc_1 RECORD;
    v_loc_2 RECORD;
    v_distance_km DOUBLE PRECISION;
    v_distance_trend TEXT := 'unknown';
    v_last_distance RECORD;
    v_latest_msg RECORD;
    v_latest_interaction RECORD;
    v_days_together INT;
    v_next_anniversary_days INT;
    v_today_question RECORD;
    v_user1_answered BOOLEAN := false;
    v_user2_answered BOOLEAN := false;
    v_result JSONB;
BEGIN
    -- Validate token
    SELECT * INTO v_space FROM public.couple_spaces WHERE widget_access_token = p_widget_token;
    IF v_space.id IS NULL THEN
        RETURN jsonb_build_object('error', 'Invalid widget token');
    END IF;

    -- Fetch members
    SELECT cm.user_id, p.nickname, p.full_name, p.avatar_url
    INTO v_member_1
    FROM public.couple_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.space_id = v_space.id
    ORDER BY cm.joined_at ASC
    LIMIT 1;

    SELECT cm.user_id, p.nickname, p.full_name, p.avatar_url
    INTO v_member_2
    FROM public.couple_members cm
    JOIN public.profiles p ON p.id = cm.user_id
    WHERE cm.space_id = v_space.id
    ORDER BY cm.joined_at DESC
    LIMIT 1;

    -- Fetch current rotated photo
    v_photo := public.get_or_rotate_current_photo(v_space.id);

    -- Fetch latest mood for member 1
    IF v_member_1.user_id IS NOT NULL THEN
        SELECT emoji, mood_label, note, created_at
        INTO v_mood_1
        FROM public.moods
        WHERE space_id = v_space.id AND user_id = v_member_1.user_id
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- Fetch latest mood for member 2
    IF v_member_2.user_id IS NOT NULL THEN
        SELECT emoji, mood_label, note, created_at
        INTO v_mood_2
        FROM public.moods
        WHERE space_id = v_space.id AND user_id = v_member_2.user_id
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    -- Fetch latest locations
    IF v_member_1.user_id IS NOT NULL AND v_member_2.user_id IS NOT NULL THEN
        SELECT latitude, longitude, is_sharing_paused, updated_at
        INTO v_loc_1
        FROM public.location_updates
        WHERE space_id = v_space.id AND user_id = v_member_1.user_id;

        SELECT latitude, longitude, is_sharing_paused, updated_at
        INTO v_loc_2
        FROM public.location_updates
        WHERE space_id = v_space.id AND user_id = v_member_2.user_id;

        IF v_loc_1.latitude IS NOT NULL AND v_loc_2.latitude IS NOT NULL 
           AND NOT v_loc_1.is_sharing_paused AND NOT v_loc_2.is_sharing_paused THEN
            -- Haversine formula
            v_distance_km := round((
                6371 * acos(
                    least(1.0, greatest(-1.0,
                        cos(radians(v_loc_1.latitude)) * cos(radians(v_loc_2.latitude)) *
                        cos(radians(v_loc_2.longitude) - radians(v_loc_1.longitude)) +
                        sin(radians(v_loc_1.latitude)) * sin(radians(v_loc_2.latitude))
                    ))
                )
            )::numeric, 1);

            -- Check trend from previous history
            SELECT distance_km INTO v_last_distance
            FROM public.location_history
            WHERE space_id = v_space.id
            ORDER BY recorded_at DESC
            LIMIT 1;

            IF v_last_distance.distance_km IS NOT NULL THEN
                IF v_distance_km < v_last_distance.distance_km - 0.2 THEN
                    v_distance_trend := 'getting_closer';
                ELSIF v_distance_km > v_last_distance.distance_km + 0.2 THEN
                    v_distance_trend := 'moving_farther';
                ELSE
                    v_distance_trend := 'steady';
                END IF;
            END IF;
        END IF;
    END IF;

    -- Latest message
    SELECT m.content, m.created_at, p.nickname as sender_name
    INTO v_latest_msg
    FROM public.messages m
    LEFT JOIN public.profiles p ON p.id = m.sender_id
    WHERE m.space_id = v_space.id
    ORDER BY m.created_at DESC
    LIMIT 1;

    -- Latest virtual interaction
    SELECT vi.interaction_type, vi.message, vi.created_at, p.nickname as sender_name
    INTO v_latest_interaction
    FROM public.virtual_interactions vi
    LEFT JOIN public.profiles p ON p.id = vi.sender_id
    WHERE vi.space_id = v_space.id
    ORDER BY vi.created_at DESC
    LIMIT 1;

    -- Days together & anniversary calculation
    v_days_together := GREATEST(0, (CURRENT_DATE - v_space.relationship_start_date));
    
    -- Next anniversary calculation
    DECLARE
        v_next_anniv DATE;
        v_this_year_anniv DATE;
    BEGIN
        v_this_year_anniv := (v_space.relationship_start_date + (date_part('year', CURRENT_DATE) - date_part('year', v_space.relationship_start_date)) * INTERVAL '1 year')::DATE;
        IF v_this_year_anniv >= CURRENT_DATE THEN
            v_next_anniv := v_this_year_anniv;
        ELSE
            v_next_anniv := (v_this_year_anniv + INTERVAL '1 year')::DATE;
        END IF;
        v_next_anniversary_days := (v_next_anniv - CURRENT_DATE);
    END;

    -- Today's question
    SELECT q.id, q.question_text, q.category
    INTO v_today_question
    FROM public.daily_questions q
    ORDER BY q.day_index ASC
    LIMIT 1;

    IF v_today_question.id IS NOT NULL THEN
        IF v_member_1.user_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.question_answers
                WHERE space_id = v_space.id AND question_id = v_today_question.id AND user_id = v_member_1.user_id
            ) INTO v_user1_answered;
        END IF;

        IF v_member_2.user_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.question_answers
                WHERE space_id = v_space.id AND question_id = v_today_question.id AND user_id = v_member_2.user_id
            ) INTO v_user2_answered;
        END IF;
    END IF;

    -- Construct consolidated JSON response
    v_result := jsonb_build_object(
        'space', jsonb_build_object(
            'id', v_space.id,
            'name', v_space.name,
            'relationship_start_date', v_space.relationship_start_date,
            'days_together', v_days_together,
            'next_anniversary_days', v_next_anniversary_days
        ),
        'members', jsonb_build_object(
            'user1', jsonb_build_object(
                'id', v_member_1.user_id,
                'name', COALESCE(v_member_1.nickname, v_member_1.full_name, 'You'),
                'mood', CASE WHEN v_mood_1.emoji IS NOT NULL THEN jsonb_build_object('emoji', v_mood_1.emoji, 'label', v_mood_1.mood_label, 'note', v_mood_1.note, 'updated_at', v_mood_1.created_at) ELSE NULL END,
                'location_updated_at', v_loc_1.updated_at,
                'is_paused', COALESCE(v_loc_1.is_sharing_paused, false)
            ),
            'user2', jsonb_build_object(
                'id', v_member_2.user_id,
                'name', COALESCE(v_member_2.nickname, v_member_2.full_name, 'Him'),
                'mood', CASE WHEN v_mood_2.emoji IS NOT NULL THEN jsonb_build_object('emoji', v_mood_2.emoji, 'label', v_mood_2.mood_label, 'note', v_mood_2.note, 'updated_at', v_mood_2.created_at) ELSE NULL END,
                'location_updated_at', v_loc_2.updated_at,
                'is_paused', COALESCE(v_loc_2.is_sharing_paused, false)
            )
        ),
        'photo', v_photo,
        'distance', jsonb_build_object(
            'km', v_distance_km,
            'trend', v_distance_trend,
            'is_available', (v_distance_km IS NOT NULL),
            'last_updated', GREATEST(v_loc_1.updated_at, v_loc_2.updated_at)
        ),
        'latest_message', CASE WHEN v_latest_msg.content IS NOT NULL THEN jsonb_build_object(
            'content', v_latest_msg.content,
            'sender', v_latest_msg.sender_name,
            'created_at', v_latest_msg.created_at
        ) ELSE NULL END,
        'latest_interaction', CASE WHEN v_latest_interaction.interaction_type IS NOT NULL THEN jsonb_build_object(
            'type', v_latest_interaction.interaction_type,
            'message', v_latest_interaction.message,
            'sender', v_latest_interaction.sender_name,
            'created_at', v_latest_interaction.created_at
        ) ELSE NULL END,
        'daily_question', CASE WHEN v_today_question.id IS NOT NULL THEN jsonb_build_object(
            'text', v_today_question.question_text,
            'both_answered', (v_user1_answered AND v_user2_answered),
            'user1_answered', v_user1_answered,
            'user2_answered', v_user2_answered
        ) ELSE NULL END,
        'generated_at', timezone('utc'::text, now())
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon and authenticated for the widget endpoint
GRANT EXECUTE ON FUNCTION public.get_widget_snapshot(TEXT) TO anon, authenticated;
