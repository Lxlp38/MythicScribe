export const GlobalStateKeys: {
    [key: string]: {
        description: string;
        type: 'string' | 'number' | 'boolean';
    };
} = {
    latestCommitHash: {
        description: 'The latest commit hash of the extension.',
        type: 'string' as const,
    },
    savedCommitHash: {
        description: 'The saved commit hash of the extension.',
        type: 'string' as const,
    },
    extensionVersion: {
        description: 'The version of the extension.',
        type: 'string' as const,
    },
} as const;
