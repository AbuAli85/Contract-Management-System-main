-- Comprehensive RLS Policies for Auth System

-- 1. Email Verification Tokens Policies
CREATE POLICY "Users can view own verification tokens" ON email_verification_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verification tokens" ON email_verification_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- 2. Password Reset Tokens Policies
CREATE POLICY "Users can view own reset tokens" ON password_reset_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage reset tokens" ON password_reset_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Trusted Devices Policies
CREATE POLICY "Users can view own trusted devices" ON trusted_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trusted devices" ON trusted_devices
    FOR ALL USING (auth.uid() = user_id);

-- 4. Security Events Policies
CREATE POLICY "Users can view own security events" ON security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can create security events" ON security_events
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 5. API Keys Policies
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API keys" ON api_keys
    FOR ALL USING (auth.uid() = user_id);

-- 6. OAuth Connections Policies
CREATE POLICY "Users can view own OAuth connections" ON oauth_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own OAuth connections" ON oauth_connections
    FOR ALL USING (auth.uid() = user_id);

-- 7. Rate Limits Policies (read-only for users)
CREATE POLICY "Service role can manage rate limits" ON rate_limits_v2
    FOR ALL USING (auth.role() = 'service_role');

-- 8. Compliance Audit Policies
CREATE POLICY "Users can view own audit entries" ON compliance_audit
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = performed_by);

CREATE POLICY "Admins can view all audit entries" ON compliance_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can create audit entries" ON compliance_audit
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 9. User Preferences Policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- 10. Enhanced Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own non-admin fields" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        (OLD.role = NEW.role OR OLD.role != 'admin') -- Prevent self-promotion to admin
    );

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role has full access to profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- 11. MFA Settings Enhanced Policies
DROP POLICY IF EXISTS "Users can manage own MFA" ON mfa_settings;

CREATE POLICY "Users can view own MFA settings" ON mfa_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA settings" ON mfa_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage MFA settings" ON mfa_settings
    FOR ALL USING (auth.role() = 'service_role');

-- 12. User Sessions Enhanced Policies
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON user_sessions;

CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- 13. Auth Logs Enhanced Policies
CREATE POLICY "Service role can manage auth logs" ON auth_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON email_verification_tokens TO authenticated;
GRANT SELECT ON password_reset_tokens TO authenticated;
GRANT ALL ON trusted_devices TO authenticated;
GRANT SELECT ON security_events TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON oauth_connections TO authenticated;
GRANT SELECT ON compliance_audit TO authenticated;
GRANT ALL ON user_preferences TO authenticated;

-- Service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
