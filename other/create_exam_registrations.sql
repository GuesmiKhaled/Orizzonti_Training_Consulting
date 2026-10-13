-- Capacity per exam session (NULL = unlimited)
IF COL_LENGTH('exam_sessions', 'maxParticipants') IS NULL
BEGIN
    ALTER TABLE [exam_sessions] ADD [maxParticipants] INT NULL;
    PRINT 'Column exam_sessions.maxParticipants added.';
END

-- Registration requests that admins accept or reject
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'exam_registrations')
BEGIN
    CREATE TABLE [exam_registrations] (
        [id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [examSessionId] INT NOT NULL,
        [fullName] NVARCHAR(200) NOT NULL,
        [email] NVARCHAR(200) NOT NULL,
        [phone] NVARCHAR(100) NULL,
        [message] NVARCHAR(MAX) NULL,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'pending',
        [createdAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_exam_registrations_exam_sessions] FOREIGN KEY ([examSessionId]) REFERENCES [exam_sessions]([id]) ON DELETE CASCADE
    );
    CREATE INDEX [IDX_exam_registrations_session_status] ON [exam_registrations]([examSessionId], [status]);
    PRINT 'Table exam_registrations created successfully.';
END
ELSE
BEGIN
    PRINT 'Table exam_registrations already exists.';
END
