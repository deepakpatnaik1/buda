/**
 * BUDA Create Command
 * 
 * Creates new BUDA projects with Boss Rules enforcement baked in.
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { execSync } from 'child_process';

interface CreateOptions {
  template?: string;
  skipGit?: boolean;
  skipInstall?: boolean;
}

export async function createProject(name: string, options: CreateOptions = {}) {
  console.log(chalk.cyan('🎯 Creating new BUDA project...'));
  
  const projectPath = resolve(process.cwd(), name);
  
  // Check if directory already exists
  try {
    await fs.access(projectPath);
    console.error(chalk.red(`❌ Directory "${name}" already exists`));
    process.exit(1);
  } catch {
    // Directory doesn't exist, which is what we want
  }

  // Project configuration prompt
  const config = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Choose project template:',
      choices: [
        { name: '⚡ Svelte + TypeScript (Recommended)', value: 'svelte-ts' },
        { name: '⚛️  React + TypeScript', value: 'react-ts' },
        { name: '🟢 Node.js + TypeScript', value: 'node-ts' },
        { name: '🔧 Custom (Advanced)', value: 'custom' }
      ],
      default: options.template || 'svelte-ts'
    },
    {
      type: 'confirm',
      name: 'enableAllRules',
      message: 'Enable all 10 Boss Rules enforcement?',
      default: true
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select additional features:',
      choices: [
        { name: '🧪 Testing framework (Vitest + Testing Library)', value: 'testing', checked: true },
        { name: '📚 Storybook for UI components', value: 'storybook', checked: false },
        { name: '🔄 GitHub Actions CI/CD', value: 'github-actions', checked: true },
        { name: '📖 Documentation site', value: 'docs', checked: false },
        { name: '🐳 Docker configuration', value: 'docker', checked: false }
      ]
    }
  ]);

  const spinner = ora('Creating project structure...').start();

  try {
    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });
    
    // Generate project structure
    await generateProjectStructure(projectPath, config);
    
    // Initialize git if not skipped
    if (!options.skipGit) {
      spinner.text = 'Initializing git repository...';
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
      execSync('git commit -m "🎯 Initial BUDA project setup\\n\\nGenerated with @buda/cli"', { cwd: projectPath, stdio: 'ignore' });
    }

    // Install dependencies if not skipped
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
      execSync('npm install', { cwd: projectPath, stdio: 'ignore' });
    }

    spinner.succeed(chalk.green('✅ Project created successfully!'));

    // Success message with next steps
    console.log(chalk.cyan(`
📁 Project: ${chalk.bold(name)}
📍 Location: ${projectPath}
🎯 Template: ${config.template}

${chalk.bold('Next steps:')}
  ${chalk.gray('$')} cd ${name}
  ${chalk.gray('$')} npm run dev

${chalk.bold('Available commands:')}
  ${chalk.cyan('buda generate model User')}     # Generate LEGO component
  ${chalk.cyan('buda design user-auth')}       # Start design-first workflow  
  ${chalk.cyan('buda audit')}                  # Check Boss Rules compliance
  ${chalk.cyan('buda delete feature')}         # Simulate 30-minute deletion

${chalk.yellow('💡 All 10 Boss Rules are now enforced in your project!')}
`));

  } catch (error) {
    spinner.fail(chalk.red('❌ Failed to create project'));
    console.error(error);
    process.exit(1);
  }
}

async function generateProjectStructure(projectPath: string, config: any) {
  // Create LEGO directory structure
  const directories = [
    'src/models',
    'src/services', 
    'src/ui',
    'src/wire',
    'src/buses',
    'docs/designs',
    'docs/adrs',
    'tests',
    '.github/workflows'
  ];

  for (const dir of directories) {
    await fs.mkdir(join(projectPath, dir), { recursive: true });
  }

  // Generate package.json
  const packageJson = {
    name: config.name || 'buda-project',
    version: '1.0.0',
    description: 'BUDA project with Boss Rules enforcement',
    type: 'module',
    scripts: {
      'dev': 'vite',
      'build': 'vite build',
      'test': 'vitest',
      'test:coverage': 'vitest --coverage',
      'lint': 'eslint src/ --ext .js,.ts,.svelte',
      'lint:fix': 'eslint src/ --ext .js,.ts,.svelte --fix',
      'design-doc-check': 'node tools/check-design-doc.js',
      'audit': 'buda audit',
      'generate': 'buda generate'
    },
    dependencies: {
      '@buda/buses': '^1.0.0'
    },
    devDependencies: {
      '@buda/eslint-plugin': '^1.0.0',
      'vite': '^5.0.0',
      'vitest': '^1.1.0',
      'eslint': '^8.56.0',
      'typescript': '^5.3.0',
      'svelte': '^4.0.0',
      '@sveltejs/vite-plugin-svelte': '^3.0.0'
    }
  };

  await fs.writeFile(
    join(projectPath, 'package.json'), 
    JSON.stringify(packageJson, null, 2)
  );

  // Generate buda.config.js
  const budaConfig = `export default {
  rules: {
    designThreshold: 50,        // LOC threshold for Rule #1
    testCoverage: 80,           // Minimum test coverage for Rule #2
    deletePlan: true,           // Enforce Rule #8 delete plans
    hardcodingAllowed: false,   // Enforce Rule #7 no hardcoding
  },
  buses: {
    event: true,    // Enable EventBus
    state: true,    // Enable StateBus  
    config: true,   // Enable ConfigBus
    error: true,    // Enable ErrorBus
  },
  lego: {
    structure: ['models', 'services', 'ui', 'wire'],
    enforce: true   // Enforce LEGO placement rules
  },
  framework: '${config.template}',
  features: ${JSON.stringify(config.features, null, 4)}
};`;

  await fs.writeFile(join(projectPath, 'buda.config.js'), budaConfig);

  // Generate ESLint config that uses BUDA
  const eslintConfig = `module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:svelte/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    '@buda'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    extraFileExtensions: ['.svelte']
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ],
  rules: {
    // BUDA Boss Rules - loaded from buda.config.js
    '@buda/require-tests': 'error',
    '@buda/lego-placement': 'error', 
    '@buda/bus-decoupling': 'error',
    '@buda/thin-wrapper': 'warn',
    '@buda/be-svelte-y': 'warn',
    '@buda/no-hardcoding': 'warn',
    '@buda/no-expired-flags': 'error',
    '@buda/no-silent-failures': 'error'
  }
};`;

  await fs.writeFile(join(projectPath, '.eslintrc.cjs'), eslintConfig);

  // Generate basic files  
  const readmeContent = `# ${config.name || 'buda-project'}

BUDA project with Boss Rules enforcement.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## BUDA Commands

- \`buda generate model User\` - Generate LEGO component  
- \`buda design user-auth\` - Start design-first workflow
- \`buda audit\` - Check Boss Rules compliance
- \`buda delete feature\` - Test 30-minute deletion

## Boss Rules Status

This project enforces all 10 Essential Boss Rules through automated tooling.`;

  await fs.writeFile(join(projectPath, 'README.md'), readmeContent);
}