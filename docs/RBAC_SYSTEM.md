# Role-Based Access Control (RBAC) System

This document explains the role-based permission system implemented in the TMS application.

## Overview

The application now uses a role-based permission system where users inherit permissions based on their assigned role, rather than having individual permission settings. This provides better scalability, consistency, and easier management.

## System Architecture

### 1. Core Components

- **Roles**: Admin, Manager, Accountant, Driver
- **Permissions**: 60+ granular feature-based permissions
- **Storage**: Role permissions stored in Firestore `rolePermissions` collection
- **Real-time Updates**: Permissions update automatically when roles are modified

### 2. Key Files

```
constants/permissions.ts         # Permission definitions and defaults
types/index.ts                  # Type definitions
app/context/PermissionsContext.tsx    # Permission state management
app/context/PermissionsLoader.tsx     # Role permission loading
app/(protected)/admin/RolePermissionManager.tsx  # Admin interface
```

## Available Roles

### Admin
- **Description**: Full system access
- **Permissions**: All available permissions (60+)
- **Use Case**: System administrators, owners

### Manager
- **Description**: Management operations
- **Permissions**: Dashboard, Orders, Drivers, Trips, Trucks, Clients, etc.
- **Use Case**: Operations managers, supervisors

### Accountant
- **Description**: Financial operations
- **Permissions**: Dashboard, Orders (view), Invoicing, Payments, Wallets, Reports
- **Use Case**: Financial staff, accountants

### Driver
- **Description**: Basic driver operations
- **Permissions**: Dashboard (view), Orders (view), Trips (view), Attendance
- **Use Case**: Truck drivers, field staff

## Permission Categories

The system organizes permissions into logical feature groups:

- **Dashboard**: View dashboard, analytics
- **Orders**: View, create, edit, delete orders
- **Drivers**: Manage drivers and documents
- **Trips**: Trip management
- **Trucks**: Fleet management
- **Clients/Receivers**: Customer management
- **Centers**: Distribution center management
- **Attendance**: Driver attendance tracking
- **Requests**: Driver requests (leave, etc.)
- **Wallets**: Financial wallet management
- **TATs**: Turn-around time management
- **Teams**: User/team management
- **Ratecard**: Pricing management
- **Reports**: Reporting and analytics
- **Admin**: System administration
- **Finance**: Invoicing and payments

## Admin Interface

### Role Permission Management

Access: `/admin/permissions` (Admin only)

Features:
- **Table Interface**: Features vs Roles with toggle switches
- **Real-time Updates**: Changes apply immediately to all users with that role
- **Default Reset**: Restore default permissions for all roles
- **Initialize**: Set up role permissions in new installations

### System Debug Panel

Access: `/admin/debug` (Admin only)

Features:
- **Current User Debug**: View loaded permissions and role info
- **System Status**: Monitor permission system health
- **Initialize**: Set up role permissions in Firestore

## Implementation Details

### Permission Loading

1. User logs in via AuthContext
2. PermissionsLoader subscribes to `rolePermissions/{role}` document
3. Permissions loaded in real-time from Firestore
4. Default permissions used as fallback

### Permission Checking

```typescript
// Hook usage
const { can } = useFeatureAccess();
if (can('FEATURE_ORDERS_CREATE')) {
  // User can create orders
}

// Component wrapper
<PermissionGate permission="FEATURE_ORDERS_VIEW">
  <OrdersPage />
</PermissionGate>
```

### Database Structure

```
Firestore Collection: rolePermissions
├── admin
│   ├── roleId: "admin"
│   ├── permissions: ["FEATURE_DASHBOARD_VIEW", ...]
│   ├── updatedAt: Timestamp
│   └── updatedBy: "userId"
├── manager
├── accountant
└── driver
```

## Migration from Individual Permissions

### Automatic Migration

The system includes migration scripts to transition from individual user permissions:

```bash
# Run migration script
npm run migrate:role-permissions
```

### Migration Process

1. **Initialize Role Permissions**: Creates default role permissions in Firestore
2. **Clean User Records**: Removes individual permission fields from user documents
3. **Preserve Role Assignments**: Maintains existing user role assignments
4. **Report Changes**: Shows statistics of migrated users

### Migration Considerations

- Users with custom permissions will inherit role-based permissions
- Review role permissions after migration to ensure proper access
- Test critical user flows after migration
- Backup user data before running migration

## Best Practices

### 1. Role Assignment
- Assign the most restrictive role that meets user needs
- Review user roles periodically
- Document role assignments and reasons

### 2. Permission Management
- Use the admin interface for permission changes
- Test permission changes with non-admin accounts
- Document any custom permission modifications

### 3. Security
- Regularly audit role permissions
- Monitor admin panel access
- Keep role permissions aligned with business requirements

### 4. Development
- Always check permissions in components with `PermissionGate`
- Use permission constants from `constants/permissions.ts`
- Test permission-protected features with different roles

## Troubleshooting

### Common Issues

**1. User can't access expected features**
- Check user's assigned role in user document
- Verify role permissions in admin panel
- Check browser console for permission errors

**2. Permissions not updating**
- Verify Firestore connection
- Check browser network tab for subscription errors
- Restart the application if needed

**3. Admin panel not accessible**
- Confirm user has 'admin' role
- Check `FEATURE_ADMIN_PANEL` permission
- Verify user is logged in

### Debug Tools

1. **Permission Debugger Component**: Shows current user permissions
2. **Browser Console**: Logs permission loading and errors
3. **Firestore Console**: View role permission documents directly
4. **System Debug Page**: Comprehensive system status

## API Reference

### Hooks

```typescript
// Get permission checking function
const { can } = useFeatureAccess();

// Get full permission context
const { permissions, hasPermission } = usePermissions();

// Get user data and role
const { userData } = useAuth();
```

### Components

```typescript
// Conditional rendering based on permissions
<PermissionGate permission="FEATURE_ORDERS_CREATE">
  <CreateOrderButton />
</PermissionGate>

// Permission debugger (development only)
<PermissionDebugger />
```

### Types

```typescript
type Role = 'admin' | 'manager' | 'accountant' | 'driver';
type FeatureId = typeof FEATURE_IDS[number];

interface RolePermissions {
  roleId: string;
  permissions: string[];
  updatedAt: Date;
  updatedBy: string;
}
```

## Performance Considerations

- **Real-time Updates**: Uses Firestore listeners for immediate permission updates
- **Caching**: Permissions cached in context to avoid repeated checks
- **Lazy Loading**: Admin components loaded dynamically
- **Optimized Rendering**: Uses `useMemo` and `useCallback` to prevent unnecessary re-renders

## Security Notes

- Role permissions stored server-side in Firestore
- Client-side permission checks for UI only
- Server-side validation required for API endpoints
- Admin operations require proper authentication
- Permission changes logged with user attribution

---

For additional support or questions about the permission system, refer to the system documentation or contact the development team.
