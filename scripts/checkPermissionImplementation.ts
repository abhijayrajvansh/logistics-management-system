import { FEATURE_IDS } from '../constants/permissions';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

async function checkPermissionImplementation() {
  const implementationStatus = new Map<string, {
    implemented: boolean;
    usageLocations: string[];
  }>();

  // Initialize all features as not implemented
  FEATURE_IDS.forEach(featureId => {
    implementationStatus.set(featureId, {
      implemented: false,
      usageLocations: []
    });
  });

  // Get all TypeScript files in the project
  const files = await glob('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', '.next/**']
  });

  // Look for PermissionGate and useFeatureAccess usage
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    FEATURE_IDS.forEach(featureId => {
      const status = implementationStatus.get(featureId)!;
      
      // Check for PermissionGate usage
      if (content.includes(`feature="${featureId}"`) || 
          content.includes(`feature={'${featureId}'}`) ||
          content.includes(`feature={"${featureId}"}`) ||
          content.includes(`can('${featureId}')`) ||
          content.includes(`hasPermission('${featureId}')`)) {
        status.implemented = true;
        status.usageLocations.push(file);
      }
    });
  }

  // Print report
  console.log('\nPermission Implementation Status:\n');
  
  // Group by implementation status
  const implemented = new Map();
  const notImplemented = new Map();
  
  implementationStatus.forEach((status, featureId) => {
    if (status.implemented) {
      implemented.set(featureId, status);
    } else {
      notImplemented.set(featureId, status);
    }
  });

  // Print implemented features
  console.log('✅ Implemented Features:', implemented.size);
  implemented.forEach((status, featureId) => {
    console.log(`\n${featureId}:`);
    status.usageLocations.forEach(location => {
      console.log(`  - ${location}`);
    });
  });

  // Print not implemented features
  console.log('\n❌ Not Implemented Features:', notImplemented.size);
  notImplemented.forEach((_, featureId) => {
    console.log(`- ${featureId}`);
  });
}

checkPermissionImplementation();
