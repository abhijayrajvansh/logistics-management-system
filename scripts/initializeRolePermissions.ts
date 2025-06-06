// Script to initialize role permissions in Firestore
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/database';
import { DEFAULT_ROLE_PERMISSIONS, AVAILABLE_ROLES } from '../constants/permissions';
import { RolePermissions } from '../types';

export async function initializeRolePermissions() {
  try {
    console.log('Initializing role permissions in Firestore...');
    
    const initPromises = AVAILABLE_ROLES.map(async (role) => {
      const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
      
      const rolePermissionData: RolePermissions = {
        roleId: role,
        permissions,
        updatedAt: new Date(),
        updatedBy: 'system-init'
      };

      const roleDoc = doc(db, 'rolePermissions', role);
      await setDoc(roleDoc, rolePermissionData);
      
      console.log(`✓ Initialized permissions for role: ${role} (${permissions.length} permissions)`);
    });

    await Promise.all(initPromises);
    console.log('✅ All role permissions initialized successfully!');
    
    return { success: true, message: 'Role permissions initialized successfully' };
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
