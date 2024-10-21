import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    overwrite: true,
    schema: [
        'https://api.goldsky.com/api/public/project_cm2evmcbvx4b601wa8gp1f4du/subgraphs/analytics/1.0.0/gn',
        'https://api.goldsky.com/api/public/project_cm2evmcbvx4b601wa8gp1f4du/subgraphs/blocklytics/1.0.0/gn',
        'https://api.goldsky.com/api/public/project_cm2evmcbvx4b601wa8gp1f4du/subgraphs/farming/1.0.0/gn',
    ],
    documents: 'src/graphql/queries/!(*.d).{ts,tsx}',
    generates: {
        'src/graphql/generated/graphql.tsx': {
            plugins: [
                'typescript',
                'typescript-operations',
                'typescript-react-apollo',
            ],
            config: {
                withHooks: true,
                withResultType: true,
            },
        },
    },
};

export default config;
