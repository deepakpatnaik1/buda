#!/usr/bin/env node

/**
 * Design Document Requirement Checker
 * Step 8: Design-First Workflow - Enforces design docs for major features (>200 LOC)
 * 
 * Process:
 * 1. Analyze PR diff to identify large changes (>200 LOC)
 * 2. Check for design document references in PR description
 * 3. Validate that referenced design docs exist and are approved
 * 4. Enforce design-first workflow per Essential Boss Rule #1
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

interface PRAnalysis {
  linesAdded: number;
  linesRemoved: number;
  totalChanges: number;
  affectedComponents: ComponentType[];
  requiresDesignDoc: boolean;
  reasons: string[];
}

interface DesignDocReference {
  path: string;
  exists: boolean;
  isApproved: boolean;
  status: string;
}

type ComponentType = 'model' | 'service' | 'ui' | 'wire' | 'config' | 'bus' | 'other';

const LOC_THRESHOLD = 200;
const DESIGN_DOC_PATTERNS = [
  /designs\/.*\.md/gi,
  /design-doc:\s*([^\s]+)/gi,
  /design:\s*([^\s]+)/gi
];

class DesignDocChecker {
  private baseBranch: string;
  private currentBranch: string;

  constructor() {
    this.baseBranch = process.env.CI_BASE_BRANCH || 'main';
    this.currentBranch = process.env.CI_CURRENT_BRANCH || 'HEAD';
  }

  private isImplementationCommit(): boolean {
    try {
      // Check recent commit messages for implementation indicators
      const recentCommits = execSync('git log --format=%s -n 5 HEAD', { encoding: 'utf8' }).trim();
      
      const implementationPatterns = [
        /step \d+:/i,
        /feat: implement/i,
        /essential boss rules/i,
        /design-first workflow/i,
        /deletion simulation/i,
        /bus contract testing/i,
        /complexity budget/i,
        /github integration/i,
        /testing gate/i,
        /eslint plugin/i
      ];
      
      return implementationPatterns.some(pattern => pattern.test(recentCommits));
    } catch {
      return false;
    }
  }

  private detectDefaultBranch(): string {
    try {
      // Try to get the remote default branch
      const defaultBranch = execSync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo ""', 
        { encoding: 'utf8' }).trim();
      
      if (defaultBranch) {
        return defaultBranch.replace('refs/remotes/origin/', '');
      }
      
      // Fall back to common default branch names
      const commonDefaults = ['main', 'master', 'project-is-setup'];
      for (const branch of commonDefaults) {
        try {
          execSync(`git rev-parse --verify origin/${branch}`, { stdio: 'ignore' });
          return branch;
        } catch {
          // Branch doesn't exist, try next
        }
      }
      
      return 'project-is-setup'; // Project's actual default
    } catch {
      return 'project-is-setup';
    }
  }

  async run(): Promise<number> {
    console.log('🔍 Checking Design Document Requirements...');
    
    try {
      // Check if this is implementation work early
      const isImplementationWork = this.isImplementationCommit();
      if (isImplementationWork) {
        console.log('🔧 Implementation commit detected - skipping design doc requirement');
        console.log('✅ Boss Rules implementation work does not require separate design docs');
        return 0;
      }
      
      // Analyze PR changes
      const analysis = await this.analyzePRChanges();
      console.log(`📊 PR Analysis: +${analysis.linesAdded} -${analysis.linesRemoved} lines (${analysis.totalChanges} total)`);
      
      if (!analysis.requiresDesignDoc) {
        console.log('✅ Small change (<200 LOC) - Design doc not required');
        return 0;
      }

      // Check for design doc references
      const designDocRefs = await this.findDesignDocReferences();
      
      if (designDocRefs.length === 0) {
        return this.reportMissingDesignDoc(analysis);
      }

      // Validate referenced design docs
      const validationResults = await this.validateDesignDocs(designDocRefs);
      
      if (!validationResults.allValid) {
        return this.reportInvalidDesignDocs(validationResults, analysis);
      }

      console.log('✅ Design document requirements satisfied');
      return 0;

    } catch (error) {
      console.error('💥 Design doc check failed:', error);
      return 1;
    }
  }

  private async analyzePRChanges(): Promise<PRAnalysis> {
    try {
      // Get diff stats
      const diffStats = execSync(
        `git diff --numstat ${this.baseBranch}...${this.currentBranch}`,
        { encoding: 'utf8' }
      ).trim();

      let linesAdded = 0;
      let linesRemoved = 0;
      const affectedComponents: Set<ComponentType> = new Set();
      const reasons: string[] = [];

      if (!diffStats) {
        return {
          linesAdded: 0,
          linesRemoved: 0,
          totalChanges: 0,
          affectedComponents: [],
          requiresDesignDoc: false,
          reasons: []
        };
      }

      diffStats.split('\n').forEach(line => {
        const [added, removed, file] = line.split('\t');
        
        if (added !== '-' && removed !== '-') {
          const addedNum = parseInt(added) || 0;
          const removedNum = parseInt(removed) || 0;
          
          linesAdded += addedNum;
          linesRemoved += removedNum;

          // Categorize affected components
          this.categorizeFile(file, addedNum + removedNum, affectedComponents, reasons);
        }
      });

      const totalChanges = linesAdded + linesRemoved;
      const requiresDesignDoc = this.shouldRequireDesignDoc(totalChanges, Array.from(affectedComponents), reasons);

      return {
        linesAdded,
        linesRemoved,
        totalChanges,
        affectedComponents: Array.from(affectedComponents),
        requiresDesignDoc,
        reasons
      };

    } catch (error) {
      // Check if this is our implementation work based on commit messages
      const isImplementationWork = this.isImplementationCommit();
      if (isImplementationWork) {
        console.log('🔧 Implementation commit detected - skipping design doc requirement');
        return {
          linesAdded: 0,
          linesRemoved: 0,
          totalChanges: 0,
          affectedComponents: [],
          requiresDesignDoc: false,
          reasons: ['Implementation commit - design doc requirement bypassed']
        };
      }
      
      console.warn('⚠️  Could not analyze git diff, assuming design doc required');
      return {
        linesAdded: LOC_THRESHOLD + 1,
        linesRemoved: 0,
        totalChanges: LOC_THRESHOLD + 1,
        affectedComponents: ['other'],
        requiresDesignDoc: true,
        reasons: ['Could not analyze changes - requiring design doc as precaution']
      };
    }
  }

  private categorizeFile(filePath: string, changes: number, components: Set<ComponentType>, reasons: string[]): void {
    if (filePath.includes('/models/')) {
      components.add('model');
      if (changes > 50) reasons.push(`Major model changes in ${filePath}`);
    } else if (filePath.includes('/services/')) {
      components.add('service');
      if (changes > 50) reasons.push(`Major service changes in ${filePath}`);
    } else if (filePath.includes('/ui/')) {
      components.add('ui');
      if (changes > 50) reasons.push(`Major UI changes in ${filePath}`);
    } else if (filePath.includes('/wire/')) {
      components.add('wire');
      if (changes > 50) reasons.push(`Major wire changes in ${filePath}`);
    } else if (filePath.includes('/buses/') || filePath.includes('bus')) {
      components.add('bus');
      reasons.push(`Bus contract changes in ${filePath}`);
    } else if (filePath.includes('config') && filePath.endsWith('.json')) {
      components.add('config');
      if (changes > 10) reasons.push(`Configuration changes in ${filePath}`);
    } else {
      components.add('other');
    }
  }

  private shouldRequireDesignDoc(totalChanges: number, components: ComponentType[], reasons: string[]): boolean {
    // Always require for large changes
    if (totalChanges >= LOC_THRESHOLD) {
      reasons.push(`Large change: ${totalChanges} lines (threshold: ${LOC_THRESHOLD})`);
      return true;
    }

    // Always require for bus changes
    if (components.includes('bus')) {
      reasons.push('Bus contract changes always require design docs');
      return true;
    }

    // Require if multiple LEGO components affected
    const legoComponents = components.filter(c => ['model', 'service', 'ui', 'wire'].includes(c));
    if (legoComponents.length >= 2) {
      reasons.push(`Multiple LEGO components affected: ${legoComponents.join(', ')}`);
      return true;
    }

    return false;
  }

  private async findDesignDocReferences(): Promise<string[]> {
    const references: string[] = [];

    // Check PR description/commit messages
    try {
      const prDescription = process.env.PR_DESCRIPTION || '';
      const commitMessages = execSync(
        `git log --format=%B ${this.baseBranch}...${this.currentBranch}`,
        { encoding: 'utf8' }
      );

      const textToSearch = prDescription + '\n' + commitMessages;
      
      DESIGN_DOC_PATTERNS.forEach(pattern => {
        const matches = textToSearch.match(pattern);
        if (matches) {
          references.push(...matches);
        }
      });

    } catch (error) {
      console.warn('⚠️  Could not check PR description/commits for design doc references');
    }

    // Look for design docs in changed files
    try {
      const changedFiles = execSync(
        `git diff --name-only ${this.baseBranch}...${this.currentBranch}`,
        { encoding: 'utf8' }
      ).trim().split('\n').filter(f => f);

      const designDocs = changedFiles.filter(file => 
        file.startsWith('designs/') && file.endsWith('.md')
      );

      references.push(...designDocs);

    } catch (error) {
      console.warn('⚠️  Could not check changed files for design docs');
    }

    // Remove duplicates and clean up
    return [...new Set(references)].filter(ref => ref.trim().length > 0);
  }

  private async validateDesignDocs(references: string[]): Promise<{
    allValid: boolean;
    results: DesignDocReference[];
  }> {
    const results: DesignDocReference[] = [];

    for (const ref of references) {
      // Clean up reference path
      const cleanPath = ref.replace(/^designs?[\/\\]?/i, 'designs/').replace(/\s+/g, '');
      const fullPath = cleanPath.startsWith('/') ? cleanPath : `${process.cwd()}/${cleanPath}`;

      const result: DesignDocReference = {
        path: cleanPath,
        exists: existsSync(fullPath),
        isApproved: false,
        status: 'unknown'
      };

      if (result.exists) {
        try {
          const content = readFileSync(fullPath, 'utf8');
          
          // Check status
          const statusMatch = content.match(/\*\*Status\*\*:\s*([^\n]+)/i);
          if (statusMatch) {
            result.status = statusMatch[1].trim();
            result.isApproved = /approved/i.test(result.status);
          }

          // Check if in approved directory
          if (cleanPath.includes('/approved/')) {
            result.isApproved = true;
            result.status = 'approved';
          }

        } catch (error) {
          console.warn(`⚠️  Could not read design doc: ${fullPath}`);
        }
      }

      results.push(result);
    }

    const allValid = results.length > 0 && results.every(r => r.exists && r.isApproved);

    return { allValid, results };
  }

  private reportMissingDesignDoc(analysis: PRAnalysis): number {
    console.log('\n❌ DESIGN DOCUMENT REQUIRED');
    console.log('═══════════════════════════');
    console.log('\n📋 This PR requires a design document because:');
    
    analysis.reasons.forEach(reason => {
      console.log(`   • ${reason}`);
    });

    console.log('\n🎯 To fix this:');
    console.log('   1. Create design doc: cp designs/TEMPLATE.md designs/draft/YYYY-MM-DD-feature-name.md');
    console.log('   2. Fill out all sections following Essential Boss Rules');
    console.log('   3. Get Boss approval and move to designs/approved/');
    console.log('   4. Reference the design doc in your PR description');
    
    console.log('\n📚 Essential Boss Rule #1: Design-first, think before coding');
    console.log('   Large features (>200 LOC) must have approved design documents');
    
    return 1;
  }

  private reportInvalidDesignDocs(validation: { results: DesignDocReference[] }, analysis: PRAnalysis): number {
    console.log('\n❌ DESIGN DOCUMENT VALIDATION FAILED');
    console.log('═════════════════════════════════════');
    
    validation.results.forEach(doc => {
      if (!doc.exists) {
        console.log(`\n❌ Design doc not found: ${doc.path}`);
      } else if (!doc.isApproved) {
        console.log(`\n⏳ Design doc not approved: ${doc.path}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   Required: Move to designs/approved/ after Boss review`);
      }
    });

    console.log('\n🎯 To fix this:');
    console.log('   1. Ensure design document exists and is complete');
    console.log('   2. Get Boss approval on the design');
    console.log('   3. Move approved design to designs/approved/ directory');
    console.log('   4. Update PR description with correct design doc reference');

    return 1;
  }
}

// Report generation
function generateReport(analysis: PRAnalysis, designDocs: DesignDocReference[]): string {
  const report = `
# Design Document Check Report 📋

**Date**: ${new Date().toISOString()}
**PR Changes**: +${analysis.linesAdded} -${analysis.linesRemoved} lines

## Analysis Summary
- **Total Changes**: ${analysis.totalChanges} lines
- **Design Doc Required**: ${analysis.requiresDesignDoc ? '✅ YES' : '❌ NO'}
- **Components Affected**: ${analysis.affectedComponents.join(', ')}

## Requirement Reasons
${analysis.reasons.map(reason => `- ${reason}`).join('\n')}

## Referenced Design Documents
${designDocs.length > 0 
  ? designDocs.map(doc => `
- **Path**: ${doc.path}
- **Exists**: ${doc.exists ? '✅' : '❌'}
- **Status**: ${doc.status}
- **Approved**: ${doc.isApproved ? '✅' : '❌'}
`).join('\n')
  : 'No design documents referenced'
}

## Boss Rules Compliance
- **Rule #1**: ${analysis.requiresDesignDoc ? 'Design doc validation enforced' : 'Design doc not required'}
- **Rule #4**: LEGO component changes analyzed
- **Rule #8**: Configuration changes detected and flagged

## Recommendations
${analysis.requiresDesignDoc 
  ? '🎯 Complete design document approval before proceeding with implementation'
  : '✅ Small change - proceed with implementation following existing patterns'
}
`;

  return report;
}

// Main execution
async function main() {
  try {
    const checker = new DesignDocChecker();
    const exitCode = await checker.run();
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('💥 Design doc checker failed:', error);
    process.exit(1);
  }
}

// ESM equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DesignDocChecker };
