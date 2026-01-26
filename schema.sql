-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "moddatetime";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. ENUMS & TYPES
-- =============================================================================
CREATE TYPE app_role AS ENUM (
    'disabled_person',
    'volunteer',
    'partner_representative',
    'admin',
    'government'
);

CREATE TYPE request_status AS ENUM (
    'created',
    'accepted',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE partner_type AS ENUM (
    'government',
    'business',
    'association'
);

CREATE TYPE place_category AS ENUM (
    'healthcare',
    'education',
    'government',
    'transport',
    'retail',
    'leisure',
    'other'
);

CREATE TYPE issue_type AS ENUM (
    'missing_ramps',
    'incorrect_data',
    'safety_issue',
    'discrimination',
    'other'
);

CREATE TYPE report_status AS ENUM (
    'open',
    'under_review',
    'resolved',
    'dismissed'
);

CREATE TYPE verification_status AS ENUM (
    'unverified',
    'pending',
    'verified',
    'rejected'
);

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- PROFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_ROLES
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- USER_PRIVATE_INFO
CREATE TABLE public.user_private_info (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    phone_number TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISABILITY DEFINITIONS
CREATE TABLE public.ref_disabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- USER DISABILITIES (Updated: Verification workflow)
CREATE TABLE public.user_disabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    disability_id UUID REFERENCES public.ref_disabilities(id) ON DELETE CASCADE NOT NULL,
    severity INTEGER CHECK (severity BETWEEN 1 AND 4) NOT NULL,
    is_visible BOOLEAN DEFAULT FALSE,
    
    -- Verification Support
    status verification_status DEFAULT 'unverified',
    document_url TEXT, -- Path to file in storage, Admin/Owner access only
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, disability_id)
);

-- VOLUNTEER METADATA (Updated: Stats tracking)
CREATE TABLE public.volunteers (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    
    -- Stats
    accumulated_seconds BIGINT DEFAULT 0, -- Total time spent helping
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CERTIFICATES (New: Rewards/Gamification)
CREATE TABLE public.certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    volunteer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "100 Hours of Service"
    description TEXT,
    badge_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTNERS
CREATE TABLE public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type partner_type NOT NULL,
    is_certified BOOLEAN DEFAULT FALSE,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTNER MEMBERS
CREATE TABLE public.partner_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(partner_id, user_id)
);

-- PLACES (Updated: Categorization)
CREATE TABLE public.places (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category place_category DEFAULT 'other', -- Categorical classification
    description TEXT,
    
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    address TEXT,
    
    -- Accessibility Features
    has_ramps BOOLEAN DEFAULT FALSE,
    has_assistants BOOLEAN DEFAULT FALSE,
    has_tactile_paths BOOLEAN DEFAULT FALSE,
    has_braille BOOLEAN DEFAULT FALSE,
    has_audio_support BOOLEAN DEFAULT FALSE,
    
    photos TEXT[],
    is_approved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HELP REQUESTS (Updated: Lifecycle & Cancellation)
CREATE TABLE public.help_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Core attrs
    is_emergency BOOLEAN DEFAULT FALSE, -- Emergency requests bypass timing constraints
    complexity_level INTEGER CHECK (complexity_level BETWEEN 1 AND 5) DEFAULT 1,
    volunteers_needed INTEGER DEFAULT 1 CHECK (volunteers_needed >= 1),
    
    -- Location
    origin_latitude DOUBLE PRECISION NOT NULL CHECK (origin_latitude BETWEEN -90 AND 90),
    origin_longitude DOUBLE PRECISION NOT NULL CHECK (origin_longitude BETWEEN -180 AND 180),
    destination_latitude DOUBLE PRECISION NOT NULL CHECK (destination_latitude BETWEEN -90 AND 90),
    destination_longitude DOUBLE PRECISION NOT NULL CHECK (destination_longitude BETWEEN -180 AND 180),
    
    -- Lifecycle
    status request_status DEFAULT 'created',
    description TEXT,
    
    -- Timing & Cancellation
    started_at TIMESTAMPTZ, -- Set when status -> in_progress
    completed_at TIMESTAMPTZ, -- Set when status -> completed
    cancelled_at TIMESTAMPTZ, -- Set when status -> cancelled
    
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: Cancellation requires reason
    CONSTRAINT check_cancellation_reason CHECK (
        (status != 'cancelled') OR (cancellation_reason IS NOT NULL AND cancelled_by IS NOT NULL)
    )
);

-- HELP REQUEST VOLUNTEERS
CREATE TABLE public.help_request_volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.help_requests(id) ON DELETE CASCADE NOT NULL,
    volunteer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, volunteer_id)
);

-- REQUEST CONFIRMATIONS
CREATE TABLE public.request_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.help_requests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role_at_confirmation app_role NOT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHATS
CREATE TABLE public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.help_requests(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    category issue_type NOT NULL,
    status report_status DEFAULT 'open',
    
    target_place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
    target_request_id UUID REFERENCES public.help_requests(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
    
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT one_target_only CHECK (
        (target_place_id IS NOT NULL AND target_request_id IS NULL AND target_user_id IS NULL) OR
        (target_place_id IS NULL AND target_request_id IS NOT NULL AND target_user_id IS NULL) OR
        (target_place_id IS NULL AND target_request_id IS NULL AND target_user_id IS NOT NULL)
    )
);

-- REPORT CONFIRMATIONS
CREATE TABLE public.report_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- RATINGS
CREATE TABLE public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rater_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    stars INTEGER CHECK (stars BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    
    target_volunteer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    
    is_flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT rating_one_target CHECK (
        (target_volunteer_id IS NOT NULL AND target_place_id IS NULL) OR
        (target_volunteer_id IS NULL AND target_place_id IS NOT NULL)
    )
);

-- =============================================================================
-- 4. INDEXES
-- =============================================================================
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_requests_status ON public.help_requests(status);
CREATE INDEX idx_requests_geo_origin ON public.help_requests(origin_latitude, origin_longitude);
CREATE INDEX idx_places_geo ON public.places(latitude, longitude);
CREATE INDEX idx_places_category ON public.places(category);
CREATE INDEX idx_messages_chat ON public.messages(chat_id);
CREATE INDEX idx_reports_targets ON public.reports(target_place_id, target_request_id, target_user_id);

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_government()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'government'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(check_role app_role)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = check_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_request_participant(_req_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN 
    EXISTS (
        SELECT 1 FROM public.help_requests hr 
        WHERE hr.id = _req_id AND hr.requester_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.help_request_volunteers hrv 
        WHERE hrv.request_id = _req_id 
        AND hrv.volunteer_id = auth.uid() 
        AND hrv.is_accepted = TRUE
    );
END;
$$;

-- =============================================================================
-- 6. TRIGGERS & BUSINESS LOGIC
-- =============================================================================

-- Timestamp updates
CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_places BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_help_requests BEFORE UPDATE ON public.help_requests FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_user_private BEFORE UPDATE ON public.user_private_info FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Volunteer Role Sync
CREATE OR REPLACE FUNCTION public.sync_volunteer_role()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    IF (NEW.role = 'volunteer') THEN
        INSERT INTO public.volunteers (user_id) VALUES (NEW.user_id) ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER on_user_role_added AFTER INSERT ON public.user_roles FOR EACH ROW WHEN (NEW.role = 'volunteer') EXECUTE PROCEDURE public.sync_volunteer_role();

CREATE OR REPLACE FUNCTION public.cleanup_volunteer_role()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    IF (OLD.role = 'volunteer') THEN
        DELETE FROM public.volunteers WHERE user_id = OLD.user_id;
    END IF;
    RETURN OLD;
END;
$$;
CREATE TRIGGER on_user_role_removed AFTER DELETE ON public.user_roles FOR EACH ROW WHEN (OLD.role = 'volunteer') EXECUTE PROCEDURE public.cleanup_volunteer_role();

-- Append-only confirmation check
CREATE OR REPLACE FUNCTION public.prevent_update_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'This table is append-only. Updates and Deletes are not allowed.';
END;
$$;
CREATE TRIGGER enforce_append_only_req_confirmations BEFORE UPDATE OR DELETE ON public.request_confirmations FOR EACH ROW EXECUTE PROCEDURE public.prevent_update_delete();

-- Request Lifecycle Automation & Hour Tracking
CREATE OR REPLACE FUNCTION public.handle_request_lifecycle()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
    duration_sec BIGINT;
BEGIN
    -- Accepted Transition (Handled by update_request_on_accept, but enforcing consistency here if needed)
    
    -- In Progress
    IF (NEW.status = 'in_progress' AND OLD.status != 'in_progress') THEN
        NEW.started_at = NOW();
    END IF;

    -- Completed (Calculate hours)
    IF (NEW.status = 'completed' AND OLD.status != 'completed') THEN
        NEW.completed_at = NOW();
        
        -- Calculate Duration
        IF (NEW.started_at IS NOT NULL) THEN
            duration_sec := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at));
            
            -- Update Volunteers (Bonuses/Stats)
            -- All accepted volunteers on this request get the hours
            UPDATE public.volunteers
            SET accumulated_seconds = accumulated_seconds + duration_sec
            WHERE user_id IN (
                SELECT volunteer_id FROM public.help_request_volunteers 
                WHERE request_id = NEW.id AND is_accepted = TRUE
            );
        END IF;
    END IF;

    -- Cancelled
    IF (NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
        NEW.cancelled_at = NOW();
        IF (NEW.cancellation_reason IS NULL OR NEW.cancelled_by IS NULL) THEN
            RAISE EXCEPTION 'Cancellation requires a reason and actor.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_request_status_change
    BEFORE UPDATE ON public.help_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE PROCEDURE public.handle_request_lifecycle();

-- Auto-accept parent request
CREATE OR REPLACE FUNCTION public.update_request_on_accept()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    IF (NEW.is_accepted = TRUE AND OLD.is_accepted = FALSE) THEN
        UPDATE public.help_requests
        SET status = 'accepted'
        WHERE id = NEW.request_id AND status = 'created';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER on_volunteer_accept AFTER UPDATE ON public.help_request_volunteers FOR EACH ROW EXECUTE PROCEDURE public.update_request_on_accept();


-- =============================================================================
-- 7. ENABLE RLS
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_disabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_disabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_request_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 8. RLS POLICIES
-- =============================================================================

-- ... (Previous standard policies implied, focusing on updates) ...

-- PROFILES
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- USER_ROLES
CREATE POLICY "User read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- USER_PRIVATE_INFO
CREATE POLICY "User read own private" ON public.user_private_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User update own private" ON public.user_private_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User insert own private" ON public.user_private_info FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Phone sharing
CREATE POLICY "Volunteer read requester phone" ON public.user_private_info FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.help_requests hr JOIN public.help_request_volunteers hrv ON hr.id = hrv.request_id WHERE hr.requester_id = user_private_info.user_id AND hrv.volunteer_id = auth.uid() AND hrv.is_accepted = TRUE AND hr.status IN ('accepted', 'in_progress'))
);
CREATE POLICY "Requester read volunteer phone" ON public.user_private_info FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.help_requests hr JOIN public.help_request_volunteers hrv ON hr.id = hrv.request_id WHERE hrv.volunteer_id = user_private_info.user_id AND hr.requester_id = auth.uid() AND hrv.is_accepted = TRUE AND hr.status IN ('accepted', 'in_progress'))
);

-- REF_DISABILITIES
CREATE POLICY "Public read ref" ON public.ref_disabilities FOR SELECT USING (true);

-- USER_DISABILITIES (Verification Privacy)
CREATE POLICY "User read own" ON public.user_disabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public read visible" ON public.user_disabilities FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Admin read all" ON public.user_disabilities FOR SELECT USING (public.is_admin());
CREATE POLICY "User insert own" ON public.user_disabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
-- User can update visibility/severity, but NOT status or document_url if already verified (logic could be stricter, keeping simple RLS)
CREATE POLICY "User update own" ON public.user_disabilities FOR UPDATE USING (auth.uid() = user_id); 

-- VOLUNTEERS
CREATE POLICY "Public read volunteers" ON public.volunteers FOR SELECT USING (true);
CREATE POLICY "Admin manage volunteers" ON public.volunteers FOR ALL USING (public.is_admin());

-- CERTIFICATES
CREATE POLICY "Public read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Admin manage certificates" ON public.certificates FOR ALL USING (public.is_admin());

-- PLACES
CREATE POLICY "Public read places" ON public.places FOR SELECT USING (true);
CREATE POLICY "Admin manage places" ON public.places FOR ALL USING (public.is_admin());
CREATE POLICY "Partner manage places" ON public.places FOR ALL USING (
    EXISTS (SELECT 1 FROM public.partner_members pm WHERE pm.partner_id = places.partner_id AND pm.user_id = auth.uid())
);

-- PARTNERS / MEMBERS
CREATE POLICY "Public read partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Admin manage partners" ON public.partners FOR ALL USING (public.is_admin());
CREATE POLICY "Public read members" ON public.partner_members FOR SELECT USING (true);

-- HELP REQUESTS
CREATE POLICY "Requester read own" ON public.help_requests FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Admin/Gov read all" ON public.help_requests FOR SELECT USING (public.is_admin() OR public.is_government());
CREATE POLICY "Volunteer read avail" ON public.help_requests FOR SELECT USING (
    public.has_role('volunteer') AND (status = 'created' OR is_emergency = TRUE OR EXISTS (SELECT 1 FROM public.help_request_volunteers hrv WHERE hrv.request_id = id AND hrv.volunteer_id = auth.uid()))
);
CREATE POLICY "Disabled create" ON public.help_requests FOR INSERT WITH CHECK (auth.uid() = requester_id AND public.has_role('disabled_person'));
CREATE POLICY "Requester update own" ON public.help_requests FOR UPDATE USING (auth.uid() = requester_id);
CREATE POLICY "Admin update all" ON public.help_requests FOR UPDATE USING (public.is_admin());

-- HELP REQUEST VOLUNTEERS
CREATE POLICY "Participants read" ON public.help_request_volunteers FOR SELECT USING (auth.uid() = volunteer_id OR EXISTS (SELECT 1 FROM public.help_requests hr WHERE hr.id = request_id AND hr.requester_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Volunteer apply" ON public.help_request_volunteers FOR INSERT WITH CHECK (auth.uid() = volunteer_id AND public.has_role('volunteer'));
CREATE POLICY "Volunteer update" ON public.help_request_volunteers FOR UPDATE USING (auth.uid() = volunteer_id);
CREATE POLICY "Requester update" ON public.help_request_volunteers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.help_requests hr WHERE hr.id = request_id AND hr.requester_id = auth.uid()));

-- CONFIRMATIONS
CREATE POLICY "Participants read" ON public.request_confirmations FOR SELECT USING (public.is_request_participant(request_id) OR public.is_admin());
CREATE POLICY "Participants insert" ON public.request_confirmations FOR INSERT WITH CHECK (public.is_request_participant(request_id) AND auth.uid() = user_id);

-- CHATS / MESSAGES
CREATE POLICY "Participants read chat" ON public.chats FOR SELECT USING (public.is_request_participant(request_id) OR public.is_admin());
CREATE POLICY "Participants read msg" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND public.is_request_participant(c.request_id)) OR public.is_admin());
CREATE POLICY "Participants send msg" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND public.is_request_participant(c.request_id)) AND auth.uid() = sender_id);

-- REPORTS / RATINGS
CREATE POLICY "Admin/Gov read reports" ON public.reports FOR SELECT USING (public.is_admin() OR public.is_government() OR auth.uid() = reporter_id);
CREATE POLICY "Auth create reports" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);
CREATE POLICY "Public read ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Disabled rate" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id AND public.has_role('disabled_person'));

