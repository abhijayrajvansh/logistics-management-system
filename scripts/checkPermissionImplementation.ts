import { FEATURE_IDS, FeatureId } from '../constants/permissions';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface ImplementationStatus {
  implemented: boolean;
  usageLocations: string[];
}

async function checkPermissionImplementation() {
  console.log('Starting permission implementation check...');
  console.log('Total features to check:', FEATURE_IDS.length);

  const implementationStatus = new Map<FeatureId, ImplementationStatus>();

  // Initialize all features as not implemented
  FEATURE_IDS.forEach((featureId) => {
    implementationStatus.set(featureId, {
      implemented: false,
      usageLocations: [],
    });
  });

  // Get all TypeScript files in the project
  console.log('Searching for TypeScript files...');
  const globSync = require('glob').sync;
  const files = globSync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', '.next/**'],
    cwd: process.cwd(),
  });
  console.log(`Found ${files.length} TypeScript files`);

  // Look for PermissionGate and useFeatureAccess usage
  console.log('Scanning files for permission usage...');
  let processedFiles = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
      processedFiles++;

      if (processedFiles % 10 === 0) {
        console.log(`Processed ${processedFiles}/${files.length} files...`);
      }

      FEATURE_IDS.forEach((featureId) => {
        const status = implementationStatus.get(featureId)!;

        // Check for PermissionGate usage
        if (
          content.includes(`feature="${featureId}"`) ||
          content.includes(`feature={'${featureId}'}`) ||
          content.includes(`feature={"${featureId}"}`) ||
          content.includes(`can('${featureId}')`) ||
          content.includes(`hasPermission('${featureId}')`)
        ) {
          status.implemented = true;
          status.usageLocations.push(file);
        }
      });
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
      continue;
    }
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
    status.usageLocations.forEach((location: string) => {
      console.log(`  - ${location}`);
    });
  });

  // Print not implemented features
  console.log('\n❌ Not Implemented Features:', notImplemented.size);
  notImplemented.forEach((_, featureId) => {
    console.log(`- ${featureId}`);
  });
}

checkPermissionImplementation().catch((error) => {
  console.error('Error running permission implementation check:', error);
});
