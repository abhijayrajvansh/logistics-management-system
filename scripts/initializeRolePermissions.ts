// Script to initialize role permissions in Firestore
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/database';
import { DEFAULT_ROLE_PERMISSIONS, AVAILABLE_ROLES, FeatureId } from '../constants/permissions';
import { RolePermissions } from '../types';

export async function initializeRolePermissions() {
  try {
    console.log(' > Updating role permissions in Firestore...');

    let totalAddedPerms = 0;
    let totalRemovedPerms = 0;

    const initPromises = AVAILABLE_ROLES.map(async (role) => {
      const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

      // Get existing permissions for comparison
      const roleDoc = doc(db, 'rolePermissions', role);
      const existingDoc = await getDoc(roleDoc);
      const existingPermissions = existingDoc.exists()
        ? ((existingDoc.data() as RolePermissions).permissions as FeatureId[])
        : [];

      // Find added and removed permissions
      const addedPermissions = permissions.filter((p) => !existingPermissions.includes(p));
      const removedPermissions = existingPermissions.filter((p) => !permissions.includes(p));

      totalAddedPerms += addedPermissions.length;
      totalRemovedPerms += removedPermissions.length;

      const rolePermissionData: RolePermissions = {
        roleId: role,
        permissions,
        updatedAt: new Date(),
        updatedBy: 'system-init',
      };

      await setDoc(roleDoc, rolePermissionData);

      // Log changes for this role
      console.log(`\n📋 Role: ${role.toUpperCase()}`);
      console.log(`Total permissions: ${permissions.length}`);

      if (addedPermissions.length > 0) {
        console.log('\n✨ Added permissions:');
        addedPermissions.forEach((p) => console.log(`  - ${p}`));
      }

      if (removedPermissions.length > 0) {
        console.log('\n🗑️  Removed permissions:');
        removedPermissions.forEach((p) => console.log(`  - ${p}`));
      }

      if (addedPermissions.length === 0 && removedPermissions.length === 0) {
        console.log('ℹ️  No changes in permissions');
      }
    });

    await Promise.all(initPromises);

    console.log('\n📊 Migration Summary:');
    console.log(`Total permissions added: ${totalAddedPerms}`);
    console.log(`Total permissions removed: ${totalRemovedPerms}`);
    console.log('\n✅ All role permissions initialized successfully!');

    return {
      success: true,
      message: 'Role permissions initialized successfully',
      stats: {
        totalAdded: totalAddedPerms,
        totalRemoved: totalRemovedPerms,
      },
    };
  } catch (error) {
    console.error('❌ Error initializing role permissions:', error);
    return { success: false, error };
  }
}

// Run this function when the script is executed directly
if (typeof window === 'undefined') {
  initializeRolePermissions()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(() => process.exit(1));
}
