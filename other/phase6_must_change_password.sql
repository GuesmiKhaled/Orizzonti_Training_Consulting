-- Phase 6: accounts can be forced to choose a new password at next login.
-- Idempotent and additive: existing accounts default to 0 (not forced).

IF COL_LENGTH('admin_users', 'mustChangePassword') IS NULL
    ALTER TABLE [admin_users]
        ADD [mustChangePassword] BIT NOT NULL
        CONSTRAINT [DF_admin_users_mustChangePassword] DEFAULT 0;
