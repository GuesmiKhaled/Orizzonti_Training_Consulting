-- Phase 7: server-side refresh-token allowlist for revocation (audit #4).
-- Idempotent: creates the table only if it does not exist.
-- Each refresh token issued at login/refresh gets a row keyed by its jti
-- (UUID). On refresh, the old jti is deleted and a new one inserted (rotation).
-- On logout / password change / deactivation, rows for the user are deleted,
-- which invalidates any outstanding refresh tokens.

IF OBJECT_ID(N'dbo.refresh_tokens', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[refresh_tokens]
    (
        [id]         INT IDENTITY(1, 1) NOT NULL,
        [jti]        CHAR(36)          NOT NULL,
        [userId]     INT               NOT NULL,
        [expiresAt]  DATETIME2(0)      NOT NULL,
        [createdAt]  DATETIME2(0)      NOT NULL
            CONSTRAINT [DF_refresh_tokens_createdAt] DEFAULT SYSDATETIME(),
        CONSTRAINT [PK_refresh_tokens] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [UQ_refresh_tokens_jti] UNIQUE NONCLUSTERED ([jti] ASC)
    );

    -- Look up by jti (refresh flow) and by user (revocation flow).
    CREATE NONCLUSTERED INDEX [IX_refresh_tokens_userId]
        ON [dbo].[refresh_tokens] ([userId] ASC);

    -- Optional FK to admin_users; kept deferrable-free since admin_users
    -- is the principal. Cascades on user delete so revocation is automatic.
    ALTER TABLE [dbo].[refresh_tokens]
        WITH CHECK ADD CONSTRAINT [FK_refresh_tokens_admin_users]
        FOREIGN KEY ([userId]) REFERENCES [dbo].[admin_users] ([id])
        ON DELETE CASCADE;
END
