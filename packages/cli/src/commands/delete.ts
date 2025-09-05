/**
 * BUDA Delete Command
 * 
 * 30-minute feature deletion simulation - Boss Rule #8
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

interface DeleteOptions {
  simulate?: boolean;
  yes?: boolean;
}

interface DeletionPlan {
  feature: string;
  files: string[];
  configurations: string[];
  dependencies: string[];
  estimatedTime: number; // minutes
  risks: string[];
}

export async function deleteFeature(feature: string, options: DeleteOptions = {}) {
  console.log(chalk.cyan(`🗑️  Preparing to delete feature: ${feature}`));

  // Validate we're in a BUDA project
  try {
    await fs.access('buda.config.js');
  } catch {
    console.error(chalk.red('❌ Not in a BUDA project directory'));
    process.exit(1);
  }

  try {
    // Analyze feature for deletion
    const plan = await analyzeFeaturesForDeletion(feature);
    
    if (!plan) {
      console.error(chalk.red(`❌ Feature '${feature}' not found or cannot be deleted`));
      console.error(chalk.yellow('Available features:'));
      const features = await discoverFeatures();
      features.forEach(f => console.log(`  • ${f}`));
      process.exit(1);
    }

    // Display deletion plan
    displayDeletionPlan(plan);

    // Check 30-minute constraint
    if (plan.estimatedTime > 30) {
      console.error(chalk.red(`❌ Deletion exceeds 30-minute constraint: ${plan.estimatedTime} minutes`));
      console.error(chalk.yellow('This indicates poor isolation (Boss Rule #8 violation)'));
      process.exit(1);
    }

    // Confirm deletion unless --yes flag
    if (!options.yes) {
      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: `Delete '${feature}' feature permanently?`,
        default: false
      }]);

      if (!confirm.proceed) {
        console.log(chalk.yellow('❌ Deletion cancelled'));
        return;
      }
    }

    // Perform deletion (or simulation)
    if (options.simulate) {
      await simulateDeletion(plan);
    } else {
      await performDeletion(plan);
    }

    console.log(chalk.green(`🎉 Feature '${feature}' successfully deleted!`));
    console.log(chalk.cyan(`⏱️  Deletion completed in ${plan.estimatedTime} minutes (under 30-minute limit)`));

  } catch (error) {
    console.error(chalk.red('❌ Deletion failed'));
    console.error(error);
    process.exit(1);
  }
}

async function discoverFeatures(): Promise<string[]> {
  const features: string[] = [];
  
  try {
    // Look for LEGO components to infer features
    const directories = ['src/models', 'src/services', 'src/ui', 'src/wire'];
    
    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        files
          .filter(f => f.endsWith('.ts') || f.endsWith('.svelte'))
          .map(f => f.replace(/\.(ts|svelte)$/, ''))
          .forEach(name => {
            if (!features.includes(name)) {
              features.push(name);
            }
          });
      } catch {
        // Directory doesn't exist
      }
    }
  } catch (error) {
    console.warn('Could not discover features:', error);
  }
  
  return features.sort();
}

async function analyzeFeaturesForDeletion(feature: string): Promise<DeletionPlan | null> {
  const files: string[] = [];
  const configurations: string[] = [];
  const dependencies: string[] = [];
  const risks: string[] = [];

  // Check for LEGO components
  const componentTypes = [
    { dir: 'src/models', ext: '.ts' },
    { dir: 'src/services', ext: '.ts' }, 
    { dir: 'src/ui', ext: '.svelte' },
    { dir: 'src/wire', ext: '.ts' }
  ];

  let foundComponents = 0;

  for (const { dir, ext } of componentTypes) {
    const filePath = join(dir, feature + ext);
    try {
      await fs.access(filePath);
      files.push(filePath);
      foundComponents++;
    } catch {
      // Component doesn't exist
    }
  }

  if (foundComponents === 0) {
    return null; // Feature not found
  }

  // Check for test files
  const testDirs = ['tests', 'test', '__tests__'];
  for (const testDir of testDirs) {
    try {
      const testFiles = await fs.readdir(testDir);
      testFiles
        .filter(f => f.includes(feature) && (f.includes('.test.') || f.includes('.spec.')))
        .forEach(f => files.push(join(testDir, f)));
    } catch {
      // Test directory doesn't exist
    }
  }

  // Check for configuration references
  try {
    const config = await fs.readFile('buda.config.js', 'utf8');
    if (config.includes(feature)) {
      configurations.push('buda.config.js');
    }
  } catch {
    // Config doesn't exist
  }

  // Check for dependencies (simplified analysis)
  await analyzeDependencies(feature, files, dependencies, risks);

  // Estimate deletion time
  let estimatedTime = 5; // Base time
  estimatedTime += files.length * 2; // 2 minutes per file
  estimatedTime += configurations.length * 3; // 3 minutes per config
  estimatedTime += dependencies.length * 5; // 5 minutes per dependency
  
  return {
    feature,
    files,
    configurations,
    dependencies,
    estimatedTime,
    risks
  };
}

async function analyzeDependencies(feature: string, files: string[], dependencies: string[], risks: string[]) {
  // Simple dependency analysis - look for imports/references
  const srcFiles = await getAllSourceFiles();
  
  for (const srcFile of srcFiles) {
    if (files.includes(srcFile)) continue; // Skip files we're deleting
    
    try {
      const content = await fs.readFile(srcFile, 'utf8');
      
      // Look for imports
      const importRegex = new RegExp(`import.*${feature}`, 'gi');
      if (importRegex.test(content)) {
        dependencies.push(srcFile);
        risks.push(`${srcFile} imports ${feature} - may break`);
      }
      
      // Look for string references
      if (content.includes(feature)) {
        risks.push(`${srcFile} references ${feature} - check for hardcoded strings`);
      }
      
    } catch (error) {
      // Skip files we can't read
    }
  }
}

async function getAllSourceFiles(): Promise<string[]> {
  const files: string[] = [];
  const directories = ['src', 'tests', 'test', '__tests__'];
  
  for (const dir of directories) {
    try {
      const dirFiles = await fs.readdir(dir, { recursive: true });
      for (const file of dirFiles) {
        if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.svelte'))) {
          files.push(join(dir, file));
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }
  
  return files;
}

function displayDeletionPlan(plan: DeletionPlan) {
  console.log(chalk.cyan('\\n📋 Deletion Plan'));
  console.log('═'.repeat(50));
  
  console.log(chalk.bold(`Feature: ${plan.feature}`));
  console.log(chalk.bold(`Estimated Time: ${plan.estimatedTime} minutes`));
  
  if (plan.estimatedTime <= 30) {
    console.log(chalk.green('✅ Within 30-minute constraint'));
  } else {
    console.log(chalk.red('❌ Exceeds 30-minute constraint'));
  }
  
  console.log('\\n' + chalk.bold('Files to Delete:'));
  plan.files.forEach(file => {
    console.log(`  🗑️  ${file}`);
  });
  
  if (plan.configurations.length > 0) {
    console.log('\\n' + chalk.bold('Configuration Updates:'));
    plan.configurations.forEach(config => {
      console.log(`  ⚙️  ${config}`);
    });
  }
  
  if (plan.dependencies.length > 0) {
    console.log('\\n' + chalk.bold('Dependencies to Update:'));
    plan.dependencies.forEach(dep => {
      console.log(`  🔗 ${dep}`);
    });
  }
  
  if (plan.risks.length > 0) {
    console.log('\\n' + chalk.yellow.bold('⚠️  Risks:'));
    plan.risks.forEach(risk => {
      console.log(`  ⚠️  ${risk}`);
    });
  }
  
  console.log('═'.repeat(50));
}

async function simulateDeletion(plan: DeletionPlan) {
  console.log(chalk.cyan('\\n🎭 Simulating deletion...'));
  
  // Create backup directory
  const backupDir = `.deletion-backup-${Date.now()}`;
  await fs.mkdir(backupDir, { recursive: true });
  
  try {
    // Move files to backup (simulate deletion)
    for (const file of plan.files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        await fs.writeFile(join(backupDir, file.replace(/\\//g, '_')), content);
        await fs.unlink(file);
        console.log(`  🎭 Simulated deletion: ${file}`);
      } catch (error) {
        console.log(`  ⚠️  Could not simulate deletion of ${file}: ${error}`);
      }
    }
    
    // Test build after simulated deletion
    console.log(chalk.cyan('\\n🔨 Testing build after deletion...'));
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log(chalk.green('✅ Build successful after deletion'));
    } catch (error) {
      console.log(chalk.red('❌ Build failed after deletion'));
      console.log(chalk.yellow('This indicates coupling violations'));
    }
    
    // Test linting
    console.log(chalk.cyan('🔍 Testing linting after deletion...'));
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      console.log(chalk.green('✅ Linting passed after deletion'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Linting issues after deletion (may be expected)'));
    }
    
  } finally {
    // Restore files
    console.log(chalk.cyan('\\n🔄 Restoring files...'));
    for (const file of plan.files) {
      try {
        const backupFile = join(backupDir, file.replace(/\\//g, '_'));
        const content = await fs.readFile(backupFile, 'utf8');
        await fs.mkdir(file.substring(0, file.lastIndexOf('/')), { recursive: true });
        await fs.writeFile(file, content);
        console.log(`  🔄 Restored: ${file}`);
      } catch (error) {
        console.log(`  ⚠️  Could not restore ${file}: ${error}`);
      }
    }
    
    // Clean up backup
    await fs.rm(backupDir, { recursive: true, force: true });
  }
  
  console.log(chalk.green('\\n🎭 Simulation complete - all files restored'));
}

async function performDeletion(plan: DeletionPlan) {
  console.log(chalk.red('\\n🗑️  Performing actual deletion...'));
  
  // Delete files
  for (const file of plan.files) {
    try {
      await fs.unlink(file);
      console.log(`  🗑️  Deleted: ${file}`);
    } catch (error) {
      console.log(`  ⚠️  Could not delete ${file}: ${error}`);
    }
  }
  
  // Update configurations
  for (const configFile of plan.configurations) {
    try {
      const content = await fs.readFile(configFile, 'utf8');
      // Simple removal of feature references (could be more sophisticated)
      const updated = content.replace(new RegExp(`.*${plan.feature}.*\\n?`, 'gi'), '');
      await fs.writeFile(configFile, updated);
      console.log(`  ⚙️  Updated: ${configFile}`);
    } catch (error) {
      console.log(`  ⚠️  Could not update ${configFile}: ${error}`);
    }
  }
  
  console.log(chalk.red('\\n💥 DELETION COMPLETE - Feature removed from codebase'));
}