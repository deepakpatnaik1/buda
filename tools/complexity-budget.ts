#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  fileSize: number;
  dependencies: number;
}

interface PRBudgetMetrics {
  totalLinesAdded: number;
  interfaceCount: number;
  busTopicCount: number;
  metricsInstrumentationCount: number;
  newServicesCount: number;
}

interface BudgetLimits {
  maxCyclomaticComplexity: number;
  maxCognitiveComplexity: number;
  maxFileSize: number;
  maxDependencies: number;
  // Step 5: PR Budget Limits
  maxPRLinesAdded: number;
  maxInterfacesPerPR: number;
  maxBusTopicsPerPR: number;
}

const BUDGET_LIMITS: BudgetLimits = {
  maxCyclomaticComplexity: 10,
  maxCognitiveComplexity: 15,
  maxFileSize: 300, // lines
  maxDependencies: 8,
  // Step 5: PR Budget Limits (Boss Rules)
  maxPRLinesAdded: 400,
  maxInterfacesPerPR: 2,
  maxBusTopicsPerPR: 1
};

function analyzePRFiles(): string[] {
  try {
    // Get changed files in current PR/branch
    const gitDiff = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' });
    return gitDiff.split('\n').filter(file => 
      file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.svelte')
    );
  } catch {
    // Fallback: analyze all source files
    const allFiles = execSync('find src -name "*.ts" -o -name "*.js" -o -name "*.svelte"', { encoding: 'utf8' });
    return allFiles.split('\n').filter(Boolean);
  }
}

function calculateComplexity(filePath: string): ComplexityMetrics {
  if (!existsSync(filePath)) {
    return { cyclomatic: 0, cognitive: 0, fileSize: 0, dependencies: 0 };
  }

  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  
  // Simple complexity heuristics
  const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
  const forLoops = (content.match(/\bfor\s*\(/g) || []).length;
  const whileLoops = (content.match(/\bwhile\s*\(/g) || []).length;
  const switches = (content.match(/\bswitch\s*\(/g) || []).length;
  const catches = (content.match(/\bcatch\s*\(/g) || []).length;
  
  const cyclomatic = 1 + ifStatements + forLoops + whileLoops + switches + catches;
  
  // Cognitive complexity adds nesting weight
  const nested = (content.match(/\s{4,}(if|for|while)\s*\(/g) || []).length;
  const cognitive = cyclomatic + nested;
  
  // Count import/export statements as dependencies
  const imports = (content.match(/^import\s/gm) || []).length;
  const exports = (content.match(/^export\s/gm) || []).length;
  const dependencies = imports + exports;

  return {
    cyclomatic,
    cognitive,
    fileSize: lines,
    dependencies
  };
}

// Step 5: PR Budget Analysis Functions
function analyzePRDiff(): PRBudgetMetrics {
  try {
    // Get git diff numstat for lines added/removed analysis
    const numstat = execSync('git diff --numstat HEAD~1', { encoding: 'utf8' });
    const lines = numstat.split('\n').filter(Boolean);
    
    let totalLinesAdded = 0;
    const changedFiles: string[] = [];
    
    for (const line of lines) {
      const [added, removed, file] = line.split('\t');
      if (file && (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.svelte'))) {
        totalLinesAdded += parseInt(added) || 0;
        changedFiles.push(file);
      }
    }
    
    let interfaceCount = 0;
    let busTopicCount = 0;
    let metricsInstrumentationCount = 0;
    let newServicesCount = 0;
    
    // Analyze each changed file
    for (const file of changedFiles) {
      if (!existsSync(file)) continue;
      
      const content = readFileSync(file, 'utf8');
      
      // AST parsing for interface declarations
      const interfaces = content.match(/^\s*interface\s+\w+/gm) || [];
      interfaceCount += interfaces.length;
      
      // String literal analysis in bus.publish() calls
      const busPublishCalls = content.match(/bus\.publish\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
      const uniqueTopics = new Set();
      busPublishCalls.forEach(call => {
        const match = call.match(/['"`]([^'"`]+)['"`]/);
        if (match) uniqueTopics.add(match[1]);
      });
      busTopicCount += uniqueTopics.size;
      
      // Check for metrics instrumentation
      const metricsEmit = (content.match(/metrics\.emit/g) || []).length;
      const metricsBusPublish = (content.match(/bus\.publish\s*\(\s*['"`]metrics/g) || []).length;
      metricsInstrumentationCount += metricsEmit + metricsBusPublish;
      
      // Check for new services
      if (file.includes('/services/') && content.includes('export class')) {
        const serviceClasses = content.match(/export\s+class\s+\w+Service/g) || [];
        newServicesCount += serviceClasses.length;
      }
    }
    
    return {
      totalLinesAdded,
      interfaceCount,
      busTopicCount,
      metricsInstrumentationCount,
      newServicesCount
    };
  } catch (error) {
    console.warn('⚠️ Could not analyze PR diff, using fallback values');
    return {
      totalLinesAdded: 0,
      interfaceCount: 0,
      busTopicCount: 0,
      metricsInstrumentationCount: 0,
      newServicesCount: 0
    };
  }
}

function validatePRBudget(prMetrics: PRBudgetMetrics): string[] {
  const violations: string[] = [];
  
  if (prMetrics.totalLinesAdded > BUDGET_LIMITS.maxPRLinesAdded) {
    violations.push(`PR adds ${prMetrics.totalLinesAdded} lines, exceeds limit ${BUDGET_LIMITS.maxPRLinesAdded}`);
  }
  
  if (prMetrics.interfaceCount > BUDGET_LIMITS.maxInterfacesPerPR) {
    violations.push(`PR adds ${prMetrics.interfaceCount} interfaces, exceeds limit ${BUDGET_LIMITS.maxInterfacesPerPR}`);
  }
  
  if (prMetrics.busTopicCount > BUDGET_LIMITS.maxBusTopicsPerPR) {
    violations.push(`PR adds ${prMetrics.busTopicCount} bus topics, exceeds limit ${BUDGET_LIMITS.maxBusTopicsPerPR}`);
  }
  
  // Rule 9: Check for metrics instrumentation in new services
  if (prMetrics.newServicesCount > 0 && prMetrics.metricsInstrumentationCount === 0) {
    violations.push(`${prMetrics.newServicesCount} new services lack metrics instrumentation (Rule 9 violation)`);
  }
  
  return violations;
}

function validateBudget(filePath: string, metrics: ComplexityMetrics): string[] {
  const violations: string[] = [];
  
  if (metrics.cyclomatic > BUDGET_LIMITS.maxCyclomaticComplexity) {
    violations.push(`Cyclomatic complexity ${metrics.cyclomatic} exceeds limit ${BUDGET_LIMITS.maxCyclomaticComplexity}`);
  }
  
  if (metrics.cognitive > BUDGET_LIMITS.maxCognitiveComplexity) {
    violations.push(`Cognitive complexity ${metrics.cognitive} exceeds limit ${BUDGET_LIMITS.maxCognitiveComplexity}`);
  }
  
  if (metrics.fileSize > BUDGET_LIMITS.maxFileSize) {
    violations.push(`File size ${metrics.fileSize} lines exceeds limit ${BUDGET_LIMITS.maxFileSize}`);
  }
  
  if (metrics.dependencies > BUDGET_LIMITS.maxDependencies) {
    violations.push(`Dependencies ${metrics.dependencies} exceed limit ${BUDGET_LIMITS.maxDependencies}`);
  }
  
  return violations;
}

function main() {
  console.log('🔍 Running complexity budget validation...');
  
  // Step 5: PR Budget Analysis
  console.log('\n📊 Step 5: PR Budget Analysis');
  const prMetrics = analyzePRDiff();
  const prViolations = validatePRBudget(prMetrics);
  
  console.log(`• Lines added: ${prMetrics.totalLinesAdded} (limit: ${BUDGET_LIMITS.maxPRLinesAdded})`);
  console.log(`• Interfaces: ${prMetrics.interfaceCount} (limit: ${BUDGET_LIMITS.maxInterfacesPerPR})`);
  console.log(`• Bus topics: ${prMetrics.busTopicCount} (limit: ${BUDGET_LIMITS.maxBusTopicsPerPR})`);
  console.log(`• New services: ${prMetrics.newServicesCount}`);
  console.log(`• Metrics calls: ${prMetrics.metricsInstrumentationCount}`);
  
  let totalViolations = prViolations.length;
  
  if (prViolations.length > 0) {
    console.log('\n❌ PR Budget Violations:');
    prViolations.forEach(violation => console.log(`  • ${violation}`));
  } else {
    console.log('✅ PR budget within limits');
  }
  
  // File-level complexity analysis
  console.log('\n🔍 File-level Complexity Analysis');
  const changedFiles = analyzePRFiles();
  
  if (changedFiles.length === 0) {
    console.log('✅ No files to analyze');
  } else {
    for (const file of changedFiles) {
      const metrics = calculateComplexity(file);
      const violations = validateBudget(file, metrics);
      
      if (violations.length > 0) {
        console.log(`\n❌ ${file}:`);
        violations.forEach(violation => console.log(`  • ${violation}`));
        totalViolations += violations.length;
      } else {
        console.log(`✅ ${file}: within budget`);
      }
    }
  }
  
  console.log(`\n📊 Summary: ${changedFiles.length} files analyzed, ${totalViolations} total violations`);
  
  if (totalViolations > 0) {
    console.log('\n🚨 Complexity budget exceeded! Refactor before merging.');
    process.exit(1);
  } else {
    console.log('\n✅ All budgets within limits');
    process.exit(0);
  }
}

// ESM equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
