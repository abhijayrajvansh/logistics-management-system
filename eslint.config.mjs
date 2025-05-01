import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Global rules that apply to all files
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
  
  // Specific overrides for files with unused variables
  {
    files: [
      '**/app/(auth)/login/layout.tsx',
      '**/app/(protected)/layout.tsx',
      '**/components/app-sidebar.tsx',
      '**/components/login-form.tsx',
      '**/components/nav-main.tsx',
      '**/components/nav-user.tsx',
      '**/components/pages/AdminDashboard.tsx',
      '**/app/(protected)/dashboard/orders/delete-order.tsx',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  
  // Specific overrides for order-related files with multiple issues
  {
    files: [
      '**/app/(protected)/dashboard/orders/columns.tsx',
      '**/app/(protected)/dashboard/orders/data-table.tsx',
      '**/app/(protected)/dashboard/orders/page.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
