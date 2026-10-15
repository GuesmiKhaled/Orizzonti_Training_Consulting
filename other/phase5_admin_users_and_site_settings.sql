-- Phase 5: contact fields on admin users, and the single-row site settings table.
-- Idempotent and additive: safe to run more than once.

IF COL_LENGTH('admin_users', 'fullName') IS NULL
    ALTER TABLE [admin_users] ADD [fullName] NVARCHAR(200) NULL;

IF COL_LENGTH('admin_users', 'email') IS NULL
    ALTER TABLE [admin_users] ADD [email] NVARCHAR(200) NULL;

IF COL_LENGTH('admin_users', 'phone') IS NULL
    ALTER TABLE [admin_users] ADD [phone] NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'site_settings')
BEGIN
    CREATE TABLE [site_settings] (
        [id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [contactEmail] NVARCHAR(200) NULL,
        [contactPhone] NVARCHAR(100) NULL,
        [contactAddress] NVARCHAR(300) NULL,
        [facebookUrl] NVARCHAR(300) NULL,
        [instagramUrl] NVARCHAR(300) NULL,
        [aboutText] NVARCHAR(MAX) NULL,
        [studentsCount] INT NULL,
        [coursesCount] INT NULL,
        [yearsOfExperience] INT NULL,
        [nextSessionDate] DATETIME NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
END
