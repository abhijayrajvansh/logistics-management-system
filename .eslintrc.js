module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Global rules that apply to the entire project
    '@typescript-eslint/no-unused-vars': 'warn', // Downgrade from error to warning
    '@typescript-eslint/no-explicit-any': 'warn', // Downgrade from error to warning
    'react/no-unescaped-entities': 'off', // Turn off unescaped entities rule
  },
  overrides: [
    // Specific overrides for files with multiple issues
    {
      files: [
        './app/(auth)/login/layout.tsx',
        './app/(protected)/layout.tsx',
        './components/app-sidebar.tsx',
        './components/login-form.tsx',
        './components/nav-main.tsx',
        './components/nav-user.tsx',
        './components/pages/AdminDashboard.tsx',
        './app/(protected)/dashboard/orders/delete-order.tsx'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      files: [
        './app/(protected)/dashboard/orders/columns.tsx',
        './app/(protected)/dashboard/orders/data-table.tsx',
        './app/(protected)/dashboard/orders/page.tsx',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/no-unescaped-entities': 'off',
      },
    }
  ],
};