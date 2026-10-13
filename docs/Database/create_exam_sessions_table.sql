-- Create exam_sessions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'exam_sessions')
BEGIN
    CREATE TABLE [exam_sessions] (
        [id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [languageLevelId] INT NOT NULL,
        [examDate] DATETIME NOT NULL,
        [location] NVARCHAR(MAX) NULL,
        [registrationStartDate] DATETIME NOT NULL,
        [registrationDeadline] DATETIME NOT NULL,
        [price] NVARCHAR(MAX) NULL,
        [courseHours] NVARCHAR(MAX) NULL,
        [subscriptionUrl] NVARCHAR(MAX) NULL,
        [isActive] BIT NOT NULL DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_exam_sessions_language_levels] FOREIGN KEY ([languageLevelId]) REFERENCES [language_levels]([id]) ON DELETE CASCADE
    );
    
    -- Create index on languageLevelId for better query performance
    CREATE INDEX [IDX_exam_sessions_languageLevelId] ON [exam_sessions]([languageLevelId]);
    
    PRINT 'Table exam_sessions created successfully.';
END
ELSE
BEGIN
    PRINT 'Table exam_sessions already exists.';
END
