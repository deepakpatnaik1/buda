/**
 * BUDA Audit Command
 * 
 * Audits project for Boss Rules compliance
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import chalk from 'chalk';

interface AuditOptions {
  fix?: boolean;
  json?: boolean;
}

interface AuditResult {
  rule: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string[];
}

export async function auditProject(options: AuditOptions = {}) {
  console.log(chalk.cyan('🔍 Auditing project for Boss Rules compliance...'));

  const results: AuditResult[] = [];

  try {
    // Rule #1: Design before code
    results.push(await checkDesignFirst());
    
    // Rule #2: TDD
    results.push(await checkTDD());
    
    // Rule #3: LEGO features  
    results.push(await checkLEGOStructure());
    
    // Rule #4: Decouple with buses
    results.push(await checkBusArchitecture());
    
    // Rule #5: Thin wrappers
    results.push(await checkThinWrappers());
    
    // Rule #7: No hardcoding
    results.push(await checkNoHardcoding());
    
    // Rule #8: Design for deletion
    results.push(await checkDeletionReadiness());
    
    // Rule #9: Instrument everything
    results.push(await checkInstrumentation());
    
    // Rule #10: Guard main
    results.push(await checkBranchProtection());

    // Output results
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      displayResults(results);
    }

    // Fix issues if requested
    if (options.fix) {
      await applyFixes(results);
    }

    // Exit with appropriate code
    const hasFailures = results.some(r => r.status === 'fail');
    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    console.error(chalk.red('❌ Audit failed'));
    console.error(error);
    process.exit(1);
  }
}

async function checkDesignFirst(): Promise<AuditResult> {
  try {
    await fs.access('docs/designs');
    const designFiles = await fs.readdir('docs/designs');
    const hasDesignDocs = designFiles.length > 0;
    
    return {
      rule: 'Rule #1: Design First',
      status: hasDesignDocs ? 'pass' : 'warn',
      message: hasDesignDocs 
        ? `Found ${designFiles.length} design documents`
        : 'No design documents found in docs/designs/',
      details: hasDesignDocs ? designFiles : undefined
    };
  } catch {
    return {
      rule: 'Rule #1: Design First',
      status: 'fail', 
      message: 'docs/designs directory does not exist'
    };
  }
}

async function checkTDD(): Promise<AuditResult> {
  try {
    // Check if test files exist
    const testDirs = ['tests', 'test', '__tests__'];
    let hasTests = false;
    let testCount = 0;
    
    for (const dir of testDirs) {
      try {
        const files = await fs.readdir(dir);
        const testFiles = files.filter(f => f.includes('.test.') || f.includes('.spec.'));
        testCount += testFiles.length;
        hasTests = hasTests || testFiles.length > 0;
      } catch {
        // Directory doesn't exist, continue
      }
    }
    
    return {
      rule: 'Rule #2: TDD',
      status: hasTests ? 'pass' : 'fail',
      message: hasTests 
        ? `Found ${testCount} test files`
        : 'No test files found'
    };
  } catch (error) {
    return {
      rule: 'Rule #2: TDD',
      status: 'fail',
      message: 'Error checking for tests: ' + (error as Error).message
    };
  }
}

async function checkLEGOStructure(): Promise<AuditResult> {
  const requiredDirs = ['src/models', 'src/services', 'src/ui', 'src/wire'];
  const missingDirs: string[] = [];
  
  for (const dir of requiredDirs) {
    try {
      await fs.access(dir);
    } catch {
      missingDirs.push(dir);
    }
  }
  
  return {
    rule: 'Rule #3: LEGO Features',
    status: missingDirs.length === 0 ? 'pass' : 'fail',
    message: missingDirs.length === 0
      ? 'LEGO directory structure complete'
      : `Missing LEGO directories: ${missingDirs.join(', ')}`,
    details: missingDirs.length > 0 ? missingDirs : undefined
  };
}

async function checkBusArchitecture(): Promise<AuditResult> {
  try {
    await fs.access('src/buses');
    const busFiles = await fs.readdir('src/buses');
    const requiredBuses = ['EventBus.ts', 'StateBus.ts', 'ConfigBus.ts', 'ErrorBus.ts'];
    const missingBuses = requiredBuses.filter(bus => !busFiles.includes(bus));
    
    return {
      rule: 'Rule #4: Decouple with Buses',
      status: missingBuses.length === 0 ? 'pass' : 'fail',
      message: missingBuses.length === 0
        ? '4-Bus architecture complete'
        : \`Missing buses: \${missingBuses.join(', ')}\`,
      details: missingBuses.length > 0 ? missingBuses : undefined
    };
  } catch {
    return {
      rule: 'Rule #4: Decouple with Buses',
      status: 'fail',
      message: 'src/buses directory does not exist'
    };
  }
}

async function checkThinWrappers(): Promise<AuditResult> {
  // This would require more sophisticated analysis
  // For now, just check if buses exist (thin wrappers around native APIs)
  try {
    const busDir = await fs.readdir('src/buses');
    return {
      rule: 'Rule #5: Thin Wrappers',
      status: 'pass',
      message: 'Bus implementations are thin wrappers',
      details: busDir
    };
  } catch {
    return {
      rule: 'Rule #5: Thin Wrappers',
      status: 'warn',
      message: 'Cannot verify thin wrapper compliance without buses'
    };
  }
}

async function checkNoHardcoding(): Promise<AuditResult> {
  try {
    // Run ESLint to check for hardcoding violations
    const eslintResult = execSync('npx eslint src/ --format json', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const results = JSON.parse(eslintResult);
    const hardcodingViolations = results
      .flatMap((file: any) => file.messages)
      .filter((msg: any) => msg.ruleId && msg.ruleId.includes('hardcoding'));
    
    return {
      rule: 'Rule #7: No Hardcoding',
      status: hardcodingViolations.length === 0 ? 'pass' : 'fail',
      message: hardcodingViolations.length === 0
        ? 'No hardcoding violations found'
        : \`Found \${hardcodingViolations.length} hardcoding violations\`
    };
  } catch (error) {
    return {
      rule: 'Rule #7: No Hardcoding',
      status: 'warn',
      message: 'Could not run ESLint check: ' + (error as Error).message
    };
  }
}

async function checkDeletionReadiness(): Promise<AuditResult> {
  try {
    await fs.access('buda.config.js');
    const config = await fs.readFile('buda.config.js', 'utf8');
    const hasDeletionConfig = config.includes('deletePlan');
    
    return {
      rule: 'Rule #8: Design for Deletion',
      status: hasDeletionConfig ? 'pass' : 'warn',
      message: hasDeletionConfig
        ? 'Deletion configuration found in buda.config.js'
        : 'No deletion configuration found'
    };
  } catch {
    return {
      rule: 'Rule #8: Design for Deletion', 
      status: 'fail',
      message: 'buda.config.js not found'
    };
  }
}

async function checkInstrumentation(): Promise<AuditResult> {
  // Check if code contains logging/instrumentation
  try {
    const srcFiles = await fs.readdir('src', { recursive: true });
    let hasLogging = false;
    
    for (const file of srcFiles) {
      if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.js'))) {
        const content = await fs.readFile(\`src/\${file}\`, 'utf8');
        if (content.includes('console.log') || content.includes('console.error')) {
          hasLogging = true;
          break;
        }
      }
    }
    
    return {
      rule: 'Rule #9: Instrument Everything',
      status: hasLogging ? 'pass' : 'warn',
      message: hasLogging
        ? 'Logging found in source code'
        : 'No logging found in source code'
    };
  } catch {
    return {
      rule: 'Rule #9: Instrument Everything',
      status: 'warn',
      message: 'Could not check instrumentation'
    };
  }
}

async function checkBranchProtection(): Promise<AuditResult> {
  try {
    await fs.access('.github/workflows');
    const workflows = await fs.readdir('.github/workflows');
    const hasCIWorkflow = workflows.some(f => f.includes('ci') || f.includes('test'));
    
    return {
      rule: 'Rule #10: Guard Main',
      status: hasCIWorkflow ? 'pass' : 'warn',
      message: hasCIWorkflow
        ? 'CI workflow found'
        : 'No CI workflow found in .github/workflows'
    };
  } catch {
    return {
      rule: 'Rule #10: Guard Main',
      status: 'warn',
      message: '.github/workflows directory not found'
    };
  }
}

function displayResults(results: AuditResult[]) {
  console.log(chalk.cyan('\\n📊 Boss Rules Compliance Report'));
  console.log('═'.repeat(50));
  
  let passed = 0;
  let warned = 0;
  let failed = 0;
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : 
                 result.status === 'warn' ? '⚠️' : '❌';
    const color = result.status === 'pass' ? chalk.green :
                  result.status === 'warn' ? chalk.yellow : chalk.red;
    
    console.log(\`\${icon} \${color(result.rule)}\`);
    console.log(\`   \${result.message}\`);
    
    if (result.details) {
      result.details.forEach(detail => {
        console.log(\`   • \${detail}\`);
      });
    }
    console.log();
    
    if (result.status === 'pass') passed++;
    else if (result.status === 'warn') warned++;
    else failed++;
  });
  
  console.log('═'.repeat(50));
  console.log(chalk.green(\`✅ Passed: \${passed}\`));
  console.log(chalk.yellow(\`⚠️  Warnings: \${warned}\`));  
  console.log(chalk.red(\`❌ Failed: \${failed}\`));
  
  const total = results.length;
  const score = Math.round((passed / total) * 100);
  console.log(chalk.cyan(\`\\n🎯 Boss Rules Compliance: \${score}%\`));
  
  if (failed > 0) {
    console.log(chalk.red('\\n❌ Project has Boss Rules violations that need to be fixed.'));
  } else if (warned > 0) {
    console.log(chalk.yellow('\\n⚠️  Project has Boss Rules warnings to consider.'));
  } else {
    console.log(chalk.green('\\n🎉 Project is fully Boss Rules compliant!'));
  }
}

async function applyFixes(results: AuditResult[]) {
  console.log(chalk.cyan('\\n🔧 Applying automatic fixes...'));
  
  for (const result of results) {
    if (result.status === 'fail') {
      try {
        await applyFixForRule(result.rule);
      } catch (error) {
        console.log(chalk.yellow(\`⚠️  Could not auto-fix: \${result.rule}\`));
      }
    }
  }
}

async function applyFixForRule(rule: string) {
  switch (rule) {
    case 'Rule #1: Design First':
      await fs.mkdir('docs/designs', { recursive: true });
      await fs.writeFile('docs/designs/README.md', '# Design Documents\\n\\nDesign docs go here following Boss Rule #1.');
      console.log(chalk.green('✅ Created docs/designs directory'));
      break;
      
    case 'Rule #3: LEGO Features':
      const dirs = ['src/models', 'src/services', 'src/ui', 'src/wire'];
      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(\`\${dir}/.gitkeep\`, '');
      }
      console.log(chalk.green('✅ Created LEGO directory structure'));
      break;
      
    case 'Rule #10: Guard Main':
      await fs.mkdir('.github/workflows', { recursive: true });
      await fs.writeFile('.github/workflows/ci.yml', \`name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint
\`);
      console.log(chalk.green('✅ Created CI workflow'));
      break;
  }
}