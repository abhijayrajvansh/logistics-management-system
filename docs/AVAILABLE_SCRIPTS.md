# Available Scripts

This document provides an overview of the scripts available in the `scripts/` directory and their corresponding npm commands.

## Scripts Overview

### 1. Initialize Role Permissions
- **File**: `initializeRolePermissions.ts`
- **npm Command**: `npm run script:permissions`
- **Purpose**: Updates or initializes role-based permissions in Firestore for all available roles.
- **Use Cases**:
  - Initial setup of application permissions
  - After adding new roles or permissions
  - Resetting permissions to default state
- **Output**: Provides detailed logs of added/removed permissions and a summary of changes

### 2. Seed Users
- **File**: `seedUsers.ts`
- **npm Command**: `npm run script:seedusers`
- **Purpose**: Seeds initial user data into the database
- **Use Cases**:
  - Initial setup of application with default users
  - Adding test users to the system

### 3. Playground
- **File**: `playground.ts`
- **npm Command**: `npm run pg`
- **Purpose**: A development sandbox for testing code snippets and features
- **Use Cases**:
  - Testing new features
  - Debugging
  - Experimenting with code

## Running Scripts

To run any of these scripts, use the corresponding npm command in the project root:

```bash
# Initialize/Update Role Permissions
npm run script:permissions

# Seed Users
npm run script:seedusers

# Run Playground
npm run pg
```

Note: Make sure you have the necessary environment variables and database connections configured before running these scripts.