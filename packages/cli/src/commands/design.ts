/**
 * BUDA Design Command
 * 
 * Design-first workflow for features - Boss Rule #1
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

interface DesignOptions {
  template?: string;
}

const DESIGN_TEMPLATES = {
  feature: (name: string) => `# ${name} Feature Design

**Status**: Draft  
**Date**: ${new Date().toISOString().split('T')[0]}  
**Author**: Developer  

## Problem Statement

### What
Brief description of what this feature does.

### Why  
Why is this feature needed? What problem does it solve?

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2  
- [ ] Criterion 3

## Proposed Solution

### Architecture Overview
High-level description of the solution approach.

### LEGO Components (Rule #3)
- **Model**: \`${name}Model\` - Data structure and validation
- **Service**: \`${name}Service\` - Business logic implementation  
- **UI**: \`${name}Component\` - User interface component
- **Wire**: \`${name}Wire\` - Coordination and event handling

### Bus Events (Rule #4)
| Event | Publisher | Subscribers | Data |
|-------|-----------|-------------|------|
| \`${name.toLowerCase()}.created\` | ${name}Service | ${name}Wire, UI | ${name} object |
| \`${name.toLowerCase()}.updated\` | ${name}Service | ${name}Wire, UI | ${name} object |
| \`${name.toLowerCase()}.deleted\` | ${name}Service | ${name}Wire, UI | { id: string } |

### Interface Definitions

\`\`\`typescript
interface ${name} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // Add specific properties
}

interface ${name}Service {
  create(data: Partial<${name}>): Promise<${name}>;
  update(id: string, data: Partial<${name}>): Promise<${name}>;
  delete(id: string): Promise<void>;
}
\`\`\`

### Configuration (Rule #7)
- \`FEATURE_${name.toUpperCase()}_ENABLED\` - Feature flag
- \`${name.toUpperCase()}_MAX_ITEMS\` - Limit configuration
- \`${name.toUpperCase()}_TTL\` - Data TTL in seconds

## Implementation Plan

### Phase 1: Foundation
- [ ] Create ${name}Model with validation
- [ ] Implement ${name}Service with bus events
- [ ] Add configuration handling

### Phase 2: UI
- [ ] Create ${name}Component with Svelte patterns
- [ ] Add event subscriptions
- [ ] Implement error handling

### Phase 3: Integration  
- [ ] Create ${name}Wire for coordination
- [ ] Add to main application
- [ ] Integration testing

### Phase 4: Validation
- [ ] End-to-end testing
- [ ] Performance validation
- [ ] Boss Rules compliance check

## Testing Strategy (Rule #2)

### Unit Tests
- [ ] ${name}Model validation tests
- [ ] ${name}Service CRUD operation tests
- [ ] ${name}Component rendering tests
- [ ] ${name}Wire event handling tests

### Integration Tests
- [ ] Full feature workflow tests
- [ ] Bus communication tests
- [ ] Error scenario tests

### Bus Contract Tests
- [ ] Event publishing tests
- [ ] Event subscription tests
- [ ] Event data validation tests

## Performance & Security

### Performance Considerations
- Expected load: X requests/second
- Memory usage: Y MB
- Database queries: Z per operation

### Security Considerations
- Input validation and sanitization
- Authorization checks
- Data encryption (if applicable)

## Rollback Plan (Rule #5)

### Rollback Triggers
- Performance degradation > 20%
- Error rate > 5%
- Boss disapproval

### Rollback Steps
1. Set \`FEATURE_${name.toUpperCase()}_ENABLED=false\`
2. Deploy configuration change
3. Monitor for 5 minutes
4. Verify system stability

### Recovery Time
- Configuration rollback: 2 minutes
- Code rollback: 10 minutes  
- Data rollback: 15 minutes (if needed)

## Delete Plan (Rule #8)

### Isolation Verification
- [ ] Feature can be disabled via feature flag
- [ ] No cross-component dependencies outside buses
- [ ] Database schema is separate or versioned
- [ ] Routes are isolated
- [ ] No hardcoded references

### Deletion Steps
1. Set feature flag to false
2. Wait for 24 hours
3. Remove UI component registration
4. Remove wire initialization  
5. Remove service registration
6. Remove model definitions
7. Remove database schema (if applicable)
8. Remove configuration keys

### Deletion Time Estimate
- **Target**: 30 minutes
- **Breakdown**:
  - Configuration: 2 minutes
  - Code removal: 15 minutes  
  - Testing: 10 minutes
  - Deployment: 3 minutes

### Residual Check
- [ ] No compilation errors
- [ ] No test failures
- [ ] No runtime errors
- [ ] No database references
- [ ] No configuration references

## Boss Rules Compliance Checklist

- [ ] **Rule #1**: Design document completed before coding
- [ ] **Rule #2**: Test files planned and will be written first
- [ ] **Rule #3**: LEGO components properly separated
- [ ] **Rule #4**: Communication only through buses
- [ ] **Rule #5**: Rollback plan defined and tested
- [ ] **Rule #6**: Svelte patterns used idiomatically
- [ ] **Rule #7**: No hardcoding, all config externalized
- [ ] **Rule #8**: Delete plan ensures 30-minute removal
- [ ] **Rule #9**: Instrumentation and logging planned
- [ ] **Rule #10**: Will be reviewed before implementation

## Alternative Solutions

### Alternative 1
Brief description and why it was rejected.

### Alternative 2  
Brief description and why it was rejected.

### Alternative 3
Brief description and why it was rejected.

## Questions & Assumptions

### Open Questions
- [ ] Question 1?
- [ ] Question 2?

### Assumptions
- Assumption 1
- Assumption 2

## Approval

- [ ] Technical review completed
- [ ] Boss approval received  
- [ ] Implementation can proceed

**Approved by**: _________________  
**Date**: _________________`,

  epic: (name: string) => `# ${name} Epic Design

**Status**: Draft  
**Date**: ${new Date().toISOString().split('T')[0]}  
**Author**: Developer  

## Epic Overview

### Vision
What is the overall vision for this epic?

### Scope  
What features/components are included in this epic?

### Out of Scope
What is explicitly not included?

## Features Breakdown

### Feature 1: [Name]
- **Description**: 
- **LEGO Components**: Model, Service, UI, Wire
- **Estimated Complexity**: [S/M/L]
- **Dependencies**: None

### Feature 2: [Name]  
- **Description**:
- **LEGO Components**: Model, Service, UI, Wire
- **Estimated Complexity**: [S/M/L]
- **Dependencies**: Feature 1

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Core models and services
- [ ] Basic bus architecture
- [ ] Configuration setup

### Phase 2: Core Features (Week 2-3)
- [ ] Feature 1 implementation
- [ ] Feature 2 implementation  
- [ ] Integration testing

### Phase 3: Polish (Week 4)
- [ ] UI refinement
- [ ] Performance optimization
- [ ] Boss Rules compliance

## Success Metrics
- [ ] All features deliver expected value
- [ ] Performance meets requirements
- [ ] 100% Boss Rules compliance
- [ ] 30-minute deletion capability verified`,

  spike: (name: string) => `# ${name} Spike Investigation

**Status**: Draft  
**Date**: ${new Date().toISOString().split('T')[0]}  
**Author**: Developer  
**Timebox**: 4 hours maximum (Rule: Delete after notes)

## Investigation Goal
What specific question are we trying to answer?

## Hypothesis
What do we think we'll find?

## Investigation Plan
- [ ] Research approach 1
- [ ] Research approach 2  
- [ ] Code experiment 1
- [ ] Code experiment 2

## Findings
[To be filled during investigation]

### Technical Findings
- Finding 1
- Finding 2

### Boss Rules Implications
- Rule impact 1
- Rule impact 2

## Recommendations
[To be filled after investigation]

### Recommended Approach
Brief description of recommended solution.

### LEGO Architecture Impact
How does this affect our component structure?

### Implementation Effort
Estimated complexity and timeline.

## Next Steps
- [ ] Create design document for chosen approach
- [ ] Schedule implementation
- [ ] Delete this spike document (after notes captured)

## Notes to Preserve
Key insights that should survive spike deletion:
- Note 1
- Note 2`
};

export async function designWorkflow(feature: string, options: DesignOptions = {}) {
  console.log(chalk.cyan(`📝 Starting design-first workflow for: ${feature}`));

  // Validate we're in a BUDA project
  try {
    await fs.access('buda.config.js');
  } catch {
    console.error(chalk.red('❌ Not in a BUDA project directory'));
    console.error(chalk.yellow('Run this command from a BUDA project root'));
    process.exit(1);
  }

  // Ensure designs directory exists
  await fs.mkdir('docs/designs', { recursive: true });

  // Prompt for design template if not specified
  let template = options.template;
  if (!template) {
    const response = await inquirer.prompt([{
      type: 'list',
      name: 'template',
      message: 'Choose design template:',
      choices: [
        { name: '🎯 Feature - Complete feature design', value: 'feature' },
        { name: '📚 Epic - Multi-feature initiative', value: 'epic' },
        { name: '🔬 Spike - Research investigation (4h timebox)', value: 'spike' }
      ],
      default: 'feature'
    }]);
    template = response.template;
  }

  if (!DESIGN_TEMPLATES[template as keyof typeof DESIGN_TEMPLATES]) {
    console.error(chalk.red(`❌ Invalid template: ${template}`));
    process.exit(1);
  }

  try {
    // Generate design document
    const designContent = DESIGN_TEMPLATES[template as keyof typeof DESIGN_TEMPLATES](feature);
    const fileName = `${new Date().toISOString().split('T')[0]}-${feature.toLowerCase().replace(/\s+/g, '-')}.md`;
    const designPath = join('docs/designs', fileName);

    await fs.writeFile(designPath, designContent);

    console.log(chalk.green(`✅ Design document created: ${designPath}`));

    // Add to git if available
    try {
      await fs.access('.git');
      console.log(chalk.yellow('💡 Don\'t forget to commit the design document before implementation'));
    } catch {
      // No git repository
    }

    console.log(chalk.cyan(`
📋 Design document ready for ${feature}!

${chalk.bold('Next steps:')}
  ${chalk.gray('1.')} Review and complete the design document
  ${chalk.gray('2.')} Get Boss approval for the design  
  ${chalk.gray('3.')} Implement with: ${chalk.cyan('buda generate')}
  ${chalk.gray('4.')} Validate with: ${chalk.cyan('buda audit')}

${chalk.bold('Boss Rule #1')}: ${chalk.green('✅ Design before code - ENFORCED!')}
`));

    // For spikes, set up automatic cleanup reminder
    if (template === 'spike') {
      console.log(chalk.yellow(`
⏰ ${chalk.bold('SPIKE TIMEBOX REMINDER')}
This spike investigation has a 4-hour maximum timebox.
After completing investigation:
  • Capture key insights in "Notes to Preserve" section
  • Delete this document (as per Boss Rules)
  • Create proper feature design if needed
`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to create design document'));
    console.error(error);
    process.exit(1);
  }
}