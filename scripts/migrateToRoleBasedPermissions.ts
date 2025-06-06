// Migration script to transition from individual user permissions to role-based permissions
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/database';
import { User } from '../types';
import { initializeRolePermissions } from './initializeRolePermissions';

interface LegacyUser extends Omit<User, 'permissions'> {
  permissions?: string[];
}

export async function migrateToRoleBasedPermissions() {
  try {
    console.log('🚀 Starting migration to role-based permissions...');

    // Step 1: Initialize role permissions in Firestore
    console.log('📋 Step 1: Initializing role permissions...');
    const initResult = await initializeRolePermissions();
    if (!initResult.success) {
      throw new Error('Failed to initialize role permissions');
    }

    // Step 2: Get all users and clean up individual permissions
    console.log('👥 Step 2: Cleaning up individual user permissions...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const batch = writeBatch(db);
    let updatedUsers = 0;
    let usersWithCustomPermissions = 0;

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data() as LegacyUser;

      // Check if user has custom permissions (different from default role permissions)
      if (userData.permissions && userData.permissions.length > 0) {
        usersWithCustomPermissions++;
        console.log(`⚠️  User ${userData.email} has custom permissions that will be removed`);
        console.log(
          `   Role: ${userData.role}, Custom permissions: ${userData.permissions.length}`,
        );
      }

      // Remove the permissions field from user document
      const userRef = doc(db, 'users', userDoc.id);
      batch.update(userRef, {
        permissions: null, // This will remove the field
      });

      updatedUsers++;
    });

    // Commit the batch update
    await batch.commit();

    console.log(`✅ Migration completed successfully!`);
    console.log(`   📊 Statistics:`);
    console.log(`   - Total users updated: ${updatedUsers}`);
    console.log(`   - Users with custom permissions: ${usersWithCustomPermissions}`);
    console.log(`   - All users now use role-based permissions`);

    if (usersWithCustomPermissions > 0) {
      console.log(
        `\n⚠️  Note: ${usersWithCustomPermissions} users had custom permissions that were removed.`,
      );
      console.log(`   These users will now inherit permissions based on their role.`);
      console.log(`   Review and adjust role permissions if needed using the admin panel.`);
    }

    return {
      success: true,
      statistics: {
        totalUsers: updatedUsers,
        usersWithCustomPermissions,
      },
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}

// Run this function when the script is executed directly
if (typeof window === 'undefined') {
  migrateToRoleBasedPermissions()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Migration failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Migration script error:', error);
      process.exit(1);
    });
}
