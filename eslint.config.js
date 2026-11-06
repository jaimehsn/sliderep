// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Text follows the system font size only up to a limit (change responsive-review):
    // screens take Text / TextInput from the shared module, never straight from react-native.
    ignores: ['components/text.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message: "Import Text / TextInput from '@/components/text' (it caps font scaling).",
            },
          ],
        },
      ],
    },
  },
]);
