-- Phase 6 addendum: a picture per language, and editable hero text.
-- Idempotent and additive: safe to run more than once.

IF COL_LENGTH('languages', 'imageUrl') IS NULL
    ALTER TABLE [languages] ADD [imageUrl] NVARCHAR(255) NULL;

IF COL_LENGTH('site_settings', 'heroTitle') IS NULL
    ALTER TABLE [site_settings] ADD [heroTitle] NVARCHAR(150) NULL;

IF COL_LENGTH('site_settings', 'heroSubtitle') IS NULL
    ALTER TABLE [site_settings] ADD [heroSubtitle] NVARCHAR(300) NULL;
