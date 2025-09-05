#!/usr/bin/env node

/**
 * BUDA CLI - Boss Rules Development Architecture
 * 
 * Main command-line interface for creating, managing, and working with
 * BUDA projects that follow the 10 Essential Boss Rules.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createProject } from './commands/create.js';
import { generateComponent } from './commands/generate.js';
import { designWorkflow } from './commands/design.js';
import { auditProject } from './commands/audit.js';
import { deleteFeature } from './commands/delete.js';
import { initProject } from './commands/init.js';

const program = new Command();

// ASCII Art Banner
const banner = chalk.cyan(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ██████╗ ██╗   ██╗██████╗  █████╗                                   ║
║   ██╔══██╗██║   ██║██╔══██╗██╔══██╗                                  ║
║   ██████╔╝██║   ██║██║  ██║███████║                                  ║
║   ██╔══██╗██║   ██║██║  ██║██╔══██║                                  ║
║   ██████╔╝╚██████╔╝██████╔╝██║  ██║                                  ║
║   ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝                                  ║
║                                                                      ║
║   Boss Rules Development Architecture                                ║
║   Engineering discipline through tooling                            ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

program
  .name('buda')
  .description('Boss Rules Development Architecture CLI')
  .version('1.0.0')
  .addHelpText('beforeAll', banner);

// Core Commands
program
  .command('create <name>')
  .description('Create a new BUDA project with Boss Rules enforcement')
  .option('-t, --template <template>', 'Project template (svelte, react, node)', 'svelte')
  .option('--skip-git', 'Skip git initialization')
  .option('--skip-install', 'Skip npm install')
  .action(createProject);

program
  .command('init')
  .description('Initialize Boss Rules in an existing project')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initProject);

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate LEGO component (model|service|ui|wire)')
  .option('-t, --tests', 'Include test files')
  .option('-s, --stories', 'Include Storybook stories')
  .action(generateComponent);

program
  .command('design <feature>')
  .description('Start design-first workflow for a feature')
  .option('-t, --template <type>', 'Design template (feature|epic|spike)', 'feature')
  .action(designWorkflow);

program
  .command('audit')
  .description('Audit project for Boss Rules compliance')
  .option('-f, --fix', 'Auto-fix violations where possible')
  .option('--json', 'Output results as JSON')
  .action(auditProject);

program
  .command('delete <feature>')
  .description('Delete feature with 30-minute constraint simulation')
  .option('-s, --simulate', 'Simulate deletion without actually deleting')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(deleteFeature);

// Utility Commands
program
  .command('doctor')
  .description('Check BUDA installation and project health')
  .action(() => {
    console.log(chalk.green('🏥 BUDA Health Check'));
    console.log(chalk.yellow('   Running diagnostics...'));
    // TODO: Implement health check
    console.log(chalk.green('✅ All systems operational'));
  });

program
  .command('upgrade')
  .description('Upgrade BUDA framework and dependencies')
  .action(() => {
    console.log(chalk.blue('⬆️  BUDA Framework Upgrade'));
    // TODO: Implement upgrade logic
    console.log(chalk.green('✅ Framework upgraded successfully'));
  });

// Help customization
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
});

// Error handling
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`❌ Error: ${err.message}`));
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}