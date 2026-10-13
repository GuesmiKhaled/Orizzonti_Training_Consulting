-- Create language_levels table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'language_levels')
BEGIN
    CREATE TABLE [language_levels] (
        [id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
        [languageId] INT NOT NULL,
        [cefrLevel] NVARCHAR(MAX) NOT NULL,
        [isActive] BIT NOT NULL DEFAULT 1,
        [price] NVARCHAR(MAX) NULL,
        [courseHours] NVARCHAR(MAX) NULL,
        [createdAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [FK_language_levels_languages] FOREIGN KEY ([languageId]) REFERENCES [languages]([id]) ON DELETE CASCADE
    );
    
    -- Create index on languageId for better query performance
    CREATE INDEX [IDX_language_levels_languageId] ON [language_levels]([languageId]);
    
    PRINT 'Table language_levels created successfully.';
END
ELSE
BEGIN
    PRINT 'Table language_levels already exists.';
END
