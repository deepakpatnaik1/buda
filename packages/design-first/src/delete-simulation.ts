#!/usr/bin/env node

/**
 * Deletion Simulation Script
 * Step 7: Advanced Validation - Test "design for deletion" (Rule 8)
 * 
 * Process:
 * 1. Identify all LEGO modules (models/, services/, ui/, wire/)
 * 2. Randomly select 5% for temporary deletion  
 * 3. Run build and test to verify system still works
 * 4. Report coupling violations where deletion breaks system
 * 5. Restore deleted modules
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { glob } from 'glob';

interface DeletionResult {
  deletedModules: string[];
  buildSuccess: boolean;
  testSuccess: boolean;
  errors: string[];
  couplingViolations: string[];
}

interface ModuleInfo {
  path: string;
  type: 'model' | 'service' | 'ui' | 'wire';
  name: string;
  content: string;
}

const BACKUP_DIR = '.deletion-simulation-backup';
const DELETION_PERCENTAGE = 0.05; // 5%

class DeletionSimulator {
  private backupDir: string;
  private allModules: ModuleInfo[] = [];

  constructor() {
    this.backupDir = BACKUP_DIR;
  }

  async run(): Promise<DeletionResult> {
    console.log('🚀 Starting deletion simulation...');
    
    try {
      // Step 1: Identify all LEGO modules
      await this.identifyModules();
      console.log(`📊 Found ${this.allModules.length} LEGO modules`);
      
      // Step 2: Randomly select modules for deletion
      const modulesToDelete = this.selectModulesForDeletion();
      console.log(`🎯 Selected ${modulesToDelete.length} modules for deletion (${Math.round(DELETION_PERCENTAGE * 100)}%)`);
      
      // Step 3: Create backups and delete modules
      await this.createBackups(modulesToDelete);
      await this.deleteModules(modulesToDelete);
      
      // Step 4: Test system resilience
      const result = await this.testSystemResilience(modulesToDelete);
      
      // Step 5: Restore modules
      await this.restoreModules(modulesToDelete);
      await this.cleanupBackups();
      
      return result;
    } catch (error) {
      // Ensure we restore modules even if something fails
      try {
        await this.restoreAllBackups();
        await this.cleanupBackups();
      } catch (restoreError) {
        console.error('❌ Failed to restore modules:', restoreError);
      }
      
      throw error;
    }
  }

  private async identifyModules(): Promise<void> {
    const patterns = [
      'src/models/**/*.ts',
      'src/services/**/*.ts', 
      'src/ui/**/*.{ts,svelte}',
      'src/wire/**/*.ts'
    ];

    for (const pattern of patterns) {
      const files = await glob(pattern);
      
      for (const file of files) {
        // Skip index files and test files
        if (file.includes('index.') || file.includes('.test.') || file.includes('.spec.')) {
          continue;
        }

        const moduleType = this.getModuleType(file);
        const moduleName = this.getModuleName(file);
        const content = readFileSync(file, 'utf8');

        this.allModules.push({
          path: file,
          type: moduleType,
          name: moduleName,
          content
        });
      }
    }
  }

  private getModuleType(filePath: string): 'model' | 'service' | 'ui' | 'wire' {
    if (filePath.includes('/models/')) return 'model';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/ui/')) return 'ui';
    if (filePath.includes('/wire/')) return 'wire';
    throw new Error(`Unknown module type for ${filePath}`);
  }

  private getModuleName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(ts|svelte)$/, '');
  }

  private selectModulesForDeletion(): ModuleInfo[] {
    const totalToDelete = Math.max(1, Math.floor(this.allModules.length * DELETION_PERCENTAGE));
    const shuffled = [...this.allModules].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, totalToDelete);
  }

  private async createBackups(modules: ModuleInfo[]): Promise<void> {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }

    console.log('💾 Creating backups...');
    for (const module of modules) {
      const backupPath = `${this.backupDir}/${module.name}-${Date.now()}.backup`;
      const backupData = {
        originalPath: module.path,
        content: module.content,
        type: module.type
      };
      writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    }
  }

  private async deleteModules(modules: ModuleInfo[]): Promise<void> {
    console.log('🗑️ Temporarily deleting modules...');
    for (const module of modules) {
      console.log(`   - Deleting ${module.path}`);
      try {
        rmSync(module.path);
      } catch (error) {
        console.warn(`   ⚠️ Could not delete ${module.path}:`, error);
      }
    }
  }

  private async testSystemResilience(deletedModules: ModuleInfo[]): Promise<DeletionResult> {
    const result: DeletionResult = {
      deletedModules: deletedModules.map(m => m.path),
      buildSuccess: false,
      testSuccess: false, 
      errors: [],
      couplingViolations: []
    };

    console.log('🔧 Testing build after deletion...');
    
    // Test build
    try {
      const buildOutput = execSync('npm run build 2>&1', { 
        encoding: 'utf8',
        timeout: 60000 // 60 second timeout
      });
      result.buildSuccess = true;
      console.log('✅ Build succeeded after deletion');
    } catch (error: any) {
      result.buildSuccess = false;
      result.errors.push(`Build failed: ${error.message}`);
      console.log('❌ Build failed after deletion');
      
      // Analyze build errors for coupling violations
      this.analyzeCouplingViolations(error.message || error.stdout || '', deletedModules, result);
    }

    // Test suite (only if build succeeded)
    if (result.buildSuccess) {
      console.log('🧪 Testing suite after deletion...');
      try {
        const testOutput = execSync('npm run test:run 2>&1', { 
          encoding: 'utf8',
          timeout: 60000
        });
        result.testSuccess = true;
        console.log('✅ Tests passed after deletion');
      } catch (error: any) {
        result.testSuccess = false;
        result.errors.push(`Tests failed: ${error.message}`);
        console.log('❌ Tests failed after deletion');
        
        // Analyze test errors for coupling violations
        this.analyzeCouplingViolations(error.message || error.stdout || '', deletedModules, result);
      }
    }

    return result;
  }

  private analyzeCouplingViolations(errorOutput: string, deletedModules: ModuleInfo[], result: DeletionResult): void {
    for (const module of deletedModules) {
      // Check if error mentions the deleted module
      const moduleReferences = [
        module.name,
        module.path.replace('src/', './'),
        module.path.replace('src/', '../'),
        module.path.replace('.ts', '').replace('.svelte', '')
      ];

      for (const ref of moduleReferences) {
        if (errorOutput.includes(ref)) {
          const violation = `Coupling violation: System depends on deleted module ${module.path} (${module.type})`;
          if (!result.couplingViolations.includes(violation)) {
            result.couplingViolations.push(violation);
          }
        }
      }
    }

    // Check for common coupling patterns in errors
    const couplingPatterns = [
      { pattern: /Cannot resolve module.*from/, type: 'Direct import dependency' },
      { pattern: /Property .* does not exist on type/, type: 'Type coupling' },
      { pattern: /Cannot find name/, type: 'Symbol dependency' },
      { pattern: /Module .* has no exported member/, type: 'Export dependency' }
    ];

    for (const { pattern, type } of couplingPatterns) {
      const matches = errorOutput.match(pattern);
      if (matches) {
        result.couplingViolations.push(`${type}: ${matches[0]}`);
      }
    }
  }

  private async restoreModules(modules: ModuleInfo[]): Promise<void> {
    console.log('🔄 Restoring deleted modules...');
    for (const module of modules) {
      console.log(`   - Restoring ${module.path}`);
      try {
        writeFileSync(module.path, module.content);
      } catch (error) {
        console.error(`   ❌ Failed to restore ${module.path}:`, error);
      }
    }
  }

  private async restoreAllBackups(): Promise<void> {
    if (!existsSync(this.backupDir)) return;
    
    console.log('🚨 Emergency restore from backups...');
    const backupFiles = await glob(`${this.backupDir}/*.backup`);
    
    for (const backupFile of backupFiles) {
      try {
        const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
        writeFileSync(backupData.originalPath, backupData.content);
      } catch (error) {
        console.error(`Failed to restore from backup ${backupFile}:`, error);
      }
    }
  }

  private async cleanupBackups(): Promise<void> {
    if (existsSync(this.backupDir)) {
      rmSync(this.backupDir, { recursive: true });
    }
  }
}

// Report generation
function generateReport(result: DeletionResult): string {
  const report = `
# Deletion Simulation Report 💣

**Date**: ${new Date().toISOString()}
**Modules Deleted**: ${result.deletedModules.length}

## Deleted Modules
${result.deletedModules.map(path => `- ${path}`).join('\n')}

## Results Summary
- **Build Success**: ${result.buildSuccess ? '✅ PASS' : '❌ FAIL'}  
- **Test Success**: ${result.testSuccess ? '✅ PASS' : '❌ FAIL'}
- **Coupling Violations**: ${result.couplingViolations.length}

## Coupling Violations (Rule 8 Violations)
${result.couplingViolations.length > 0 
  ? result.couplingViolations.map(violation => `❌ ${violation}`).join('\n')
  : '✅ No coupling violations detected - system properly designed for deletion!'
}

## Errors
${result.errors.length > 0 
  ? result.errors.map(error => `- ${error}`).join('\n')
  : 'No errors detected'
}

## Recommendations
${result.couplingViolations.length > 0 
  ? '🔧 **Action Required**: Fix coupling violations to improve system resilience and deletability.'
  : '🎉 **Excellent**: System demonstrates good "design for deletion" principles (Rule 8).'
}
`;

  return report;
}

// Main execution
async function main() {
  try {
    const simulator = new DeletionSimulator();
    const result = await simulator.run();
    
    // Generate and display report
    const report = generateReport(result);
    console.log(report);
    
    // Write report to file
    const reportPath = `deletion-simulation-${Date.now()}.md`;
    writeFileSync(reportPath, report);
    console.log(`📝 Report saved to ${reportPath}`);
    
    // Exit with appropriate code
    const hasViolations = result.couplingViolations.length > 0 || !result.buildSuccess;
    process.exit(hasViolations ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Deletion simulation failed:', error);
    process.exit(1);
  }
}

// ESM equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
