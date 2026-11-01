-- Phase 8: OTP authentication challenges and trusted devices.
-- Idempotent: creates tables only if they do not exist.

-- Make admin_users.email NOT NULL. First set a placeholder for any NULLs.
IF EXISTS (
  SELECT 1 FROM sys.columns c
  WHERE c.object_id = OBJECT_ID(N'dbo.admin_users') AND c.name = N'email'
    AND c.is_nullable = 1
)
BEGIN
  UPDATE [dbo].[admin_users] SET [email] = N'admin@orizzonti.tn' WHERE [email] IS NULL;
  ALTER TABLE [dbo].[admin_users] ALTER COLUMN [email] NVARCHAR(200) NOT NULL;
END

-- OTP challenges
IF OBJECT_ID(N'dbo.otp_challenges', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[otp_challenges]
  (
    [id]            INT IDENTITY(1, 1) NOT NULL,
    [userId]        INT               NOT NULL,
    [challengeHash] CHAR(64)          NOT NULL,  -- SHA-256 hex of challengeId
    [otpHash]       NVARCHAR(255)     NOT NULL,  -- bcrypt hash of OTP code
    [expiresAt]     DATETIME2(0)      NOT NULL,
    [attempts]      INT               NOT NULL CONSTRAINT [DF_otp_challenges_attempts] DEFAULT 0,
    [maxAttempts]   INT               NOT NULL CONSTRAINT [DF_otp_challenges_maxAttempts] DEFAULT 5,
    [status]        NVARCHAR(20)      NOT NULL CONSTRAINT [DF_otp_challenges_status] DEFAULT N'pending',  -- pending|consumed|expired|superseded
    [lastResentAt]  DATETIME2(0)      NULL,
    [createdAt]     DATETIME2(0)      NOT NULL CONSTRAINT [DF_otp_challenges_createdAt] DEFAULT SYSDATETIME(),
    [consumedAt]    DATETIME2(0)      NULL,
    CONSTRAINT [PK_otp_challenges] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_otp_challenges_challengeHash] UNIQUE NONCLUSTERED ([challengeHash] ASC)
  );

  CREATE NONCLUSTERED INDEX [IX_otp_challenges_userId_status]
    ON [dbo].[otp_challenges] ([userId], [status] ASC);

  ALTER TABLE [dbo].[otp_challenges]
    WITH CHECK ADD CONSTRAINT [FK_otp_challenges_admin_users]
    FOREIGN KEY ([userId]) REFERENCES [dbo].[admin_users] ([id])
    ON DELETE CASCADE;
END

-- Trusted devices
IF OBJECT_ID(N'dbo.trusted_devices', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[trusted_devices]
  (
    [id]                    INT IDENTITY(1, 1) NOT NULL,
    [userId]                INT               NOT NULL,
    [deviceTokenHash]       NVARCHAR(255)     NOT NULL,  -- bcrypt hash of device token
    [deviceName]            NVARCHAR(200)     NULL,
    [browser]               NVARCHAR(100)     NULL,
    [operatingSystem]       NVARCHAR(100)     NULL,
    [firstAuthenticatedAt]  DATETIME2(0)      NOT NULL,
    [lastUsedAt]            DATETIME2(0)      NOT NULL,
    [expiresAt]             DATETIME2(0)      NOT NULL,
    [revokedAt]             DATETIME2(0)      NULL,
    [lastKnownIp]           NVARCHAR(45)      NULL,
    [createdAt]             DATETIME2(0)      NOT NULL CONSTRAINT [DF_trusted_devices_createdAt] DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_trusted_devices] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_trusted_devices_tokenHash] UNIQUE NONCLUSTERED ([deviceTokenHash] ASC)
  );

  CREATE NONCLUSTERED INDEX [IX_trusted_devices_userId]
    ON [dbo].[trusted_devices] ([userId] ASC);

  ALTER TABLE [dbo].[trusted_devices]
    WITH CHECK ADD CONSTRAINT [FK_trusted_devices_admin_users]
    FOREIGN KEY ([userId]) REFERENCES [dbo].[admin_users] ([id])
    ON DELETE CASCADE;
END
