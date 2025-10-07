-- Core Manufacturing Tables Migration
-- Creates the foundation tables for multi-tenant manufacturing ERP
-- Priority: CRITICAL - Required for all other features

-- Enable required extensions
-- Note: Using gen_random_uuid() from pgcrypto (pre-installed in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to get current user ID from Clerk JWT
-- Must be defined before RLS policies that reference it
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
    )::text;
$$;

-- Create custom types for better data integrity
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator');
CREATE TYPE organization_status AS ENUM ('active', 'inactive', 'trial');

-- Organizations table - Multi-tenant isolation foundation
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- For URL-friendly org identification
    status organization_status DEFAULT 'trial',
    settings JSONB DEFAULT '{}', -- Flexible settings (currency, units, etc.)
    subscription_id TEXT, -- Links to Stripe subscription
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT organizations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT organizations_slug_not_empty CHECK (LENGTH(TRIM(slug)) > 0)
);

-- User profiles table - Links Clerk users to organizations
CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email VARCHAR(320) UNIQUE NOT NULL, -- Standard email max length
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    active_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    preferences JSONB DEFAULT '{}', -- User-specific settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_profiles_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Organization users junction table - Many-to-many with roles
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role user_role DEFAULT 'operator',
    invited_by TEXT REFERENCES user_profiles(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE, -- NULL until user accepts invitation
    last_active_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    UNIQUE(organization_id, user_id), -- User can only have one role per org
    CONSTRAINT organization_users_joined_after_invited CHECK (joined_at IS NULL OR joined_at >= invited_at)
);

-- Indexes for performance
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_user_profiles_active_org ON user_profiles(active_organization_id);
CREATE INDEX idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX idx_organization_users_role ON organization_users(role);
CREATE INDEX idx_organization_users_active ON organization_users(is_active) WHERE is_active = true;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

CREATE POLICY "Admins can update their organizations" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = requesting_user_id());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = requesting_user_id());

CREATE POLICY "Users can view profiles in their organizations" ON user_profiles
    FOR SELECT USING (
        id IN (
            SELECT ou.user_id 
            FROM organization_users ou
            WHERE ou.organization_id IN (
                SELECT organization_id 
                FROM organization_users 
                WHERE user_id = requesting_user_id() 
                AND is_active = true
            )
        )
    );

-- Organization users policies
CREATE POLICY "Users can view organization memberships" ON organization_users
    FOR SELECT USING (
        user_id = requesting_user_id() 
        OR organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND role IN ('admin', 'manager')
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage organization users" ON organization_users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Helper function to get user's active organization
CREATE OR REPLACE FUNCTION get_user_active_organization()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT active_organization_id 
        FROM user_profiles 
        WHERE id = requesting_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed data for development (commented out for production)
-- INSERT INTO organizations (name, slug, status) VALUES 
--     ('Acme Manufacturing', 'acme-mfg', 'active'),
--     ('Sweet Treats Co', 'sweet-treats', 'trial');

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Core tenant table for multi-tenant isolation';
COMMENT ON TABLE user_profiles IS 'User profile data linked to Clerk authentication';
COMMENT ON TABLE organization_users IS 'Many-to-many relationship between users and organizations with role-based access';
COMMENT ON COLUMN organizations.settings IS 'JSON field for org-specific settings like currency, default units, etc.';
COMMENT ON COLUMN user_profiles.preferences IS 'JSON field for user preferences like theme, language, etc.';
COMMENT ON FUNCTION requesting_user_id() IS 'Gets the current authenticated user ID from Clerk JWT';
COMMENT ON FUNCTION get_user_active_organization() IS 'Helper function to get current users active organization';