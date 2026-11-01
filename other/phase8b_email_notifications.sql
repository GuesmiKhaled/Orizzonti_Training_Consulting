-- Phase 8b: Email notification outbox for transactional emails.
-- Idempotent: creates the table only if it does not exist.

IF OBJECT_ID(N'dbo.email_notifications', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[email_notifications]
  (
    [id]                INT IDENTITY(1, 1) NOT NULL,
    [userId]            INT               NULL,       -- nullable for public bookings
    [recipient]         NVARCHAR(200)     NOT NULL,
    [notificationType]  NVARCHAR(50)      NOT NULL,   -- otp|course_reservation|exam_booking|exam_accepted|exam_rejected
    [relatedEntityId]   INT               NULL,       -- e.g. course_request.id or exam_registration.id
    [subject]           NVARCHAR(300)     NOT NULL,
    [htmlBody]          NVARCHAR(MAX)     NULL,
    [textBody]          NVARCHAR(MAX)     NULL,
    [status]            NVARCHAR(20)      NOT NULL CONSTRAINT [DF_email_notifications_status] DEFAULT N'pending',  -- pending|sent|failed
    [retryCount]        INT               NOT NULL CONSTRAINT [DF_email_notifications_retryCount] DEFAULT 0,
    [createdAt]         DATETIME2(0)      NOT NULL CONSTRAINT [DF_email_notifications_createdAt] DEFAULT SYSDATETIME(),
    [sentAt]            DATETIME2(0)      NULL,
    [lastError]         NVARCHAR(MAX)     NULL,
    CONSTRAINT [PK_email_notifications] PRIMARY KEY CLUSTERED ([id] ASC)
  );

  -- Idempotency: one email per (notificationType, relatedEntityId).
  CREATE UNIQUE NONCLUSTERED INDEX [UX_email_notifications_type_entity]
    ON [dbo].[email_notifications] ([notificationType], [relatedEntityId])
    WHERE [relatedEntityId] IS NOT NULL;

  -- Poller picks pending rows oldest-first.
  CREATE NONCLUSTERED INDEX [IX_email_notifications_status_createdAt]
    ON [dbo].[email_notifications] ([status], [createdAt] ASC);
END
