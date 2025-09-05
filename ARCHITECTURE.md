# BUDA Framework Architecture

**Boss Rules Development Architecture - Engineering Discipline Through Tooling**

## Overview

BUDA is a complete development framework that institutionalizes the **10 Essential Boss Rules** through integrated tooling, architecture patterns, and development workflows.

## Core Principles

1. **Engineering discipline beats individual brilliance**
2. **Tooling enforces consistency better than documentation**
3. **Architecture patterns prevent common mistakes**
4. **Delete-by-design limits technical debt**
5. **Design-first prevents over-engineering**

## Framework Components

### 1. CLI Interface (`@buda/cli`)

**Purpose**: Single entry point for all BUDA operations

**Key Commands**:
```bash
buda create my-app          # New project with Boss Rules
buda generate model User    # LEGO component scaffolding
buda design user-auth       # Design-first workflow
buda audit                  # Boss Rules compliance check
buda delete feature         # 30-minute deletion simulation
```

**Architecture**:
- Command pattern with pluggable handlers
- Template-based project generation
- Interactive prompts with sensible defaults
- Progress feedback with ora spinners

### 2. 4-Bus Architecture (`@buda/buses`)

**Purpose**: Rule #4 implementation - decouple components through buses

```typescript
// Event Bus - Inter-component communication
EventBus.publish('user.created', userData);
EventBus.subscribe('user.created', handleUserCreated);

// State Bus - Global application state  
StateBus.set('currentUser', user);
const user = StateBus.get('currentUser');

// Config Bus - Configuration management
ConfigBus.get('api.baseUrl'); 
ConfigBus.set('feature.enabled', true);

// Error Bus - Error handling and logging
ErrorBus.capture(error, { context: 'user-creation' });
```

**Design Features**:
- Type-safe interfaces with TypeScript
- Built-in instrumentation (Rule #9)
- Memory leak prevention with cleanup
- Development vs production configurations

### 3. LEGO Components (`@buda/lego`)

**Purpose**: Rule #3 implementation - modular, deletable components

**Directory Structure**:
```
src/
├── models/          # Data models and schemas
├── services/        # Business logic and API calls
├── ui/             # User interface components  
├── wire/           # Coordination and orchestration
└── buses/          # Bus implementations
```

**Component Patterns**:
- **Models**: Pure data with validation schemas
- **Services**: Stateless business logic with thin wrappers (Rule #5)
- **UI**: Framework-idiomatic components (Rule #6)
- **Wire**: Coordination between other LEGO components

### 4. Boss Rules Enforcement (`@buda/eslint-plugin`)

**Purpose**: Automated enforcement of all 10 Boss Rules

**Rule Implementation**:
1. **Design Before Code**: Pre-commit hooks check for design docs on >50 LOC changes
2. **TDD**: ESLint rules require test files for all modules
3. **LEGO Features**: File placement validation in correct directories
4. **Bus Decoupling**: Detection of cross-bus dependencies
5. **Thin Wrappers**: Complexity analysis for adapter functions
6. **Framework Idiomatic**: Framework-specific best practice checks
7. **No Hardcoding**: Detection of hardcoded values
8. **Design for Deletion**: Validation of delete plans and isolation
9. **Instrument Everything**: Required logging and error handling
10. **Guard Main**: Branch protection and review enforcement

### 5. Design-First Workflow (`@buda/design-first`)

**Purpose**: Rule #1 implementation - design before coding

**Workflow**:
```bash
buda design user-authentication
# → Creates design document template
# → Validates required sections
# → Links to implementation tracking
```

**Document Structure**:
- Problem Statement (What & Why)
- Solution Architecture (How)
- LEGO Components (What gets built)
- Interfaces (API contracts)
- Data Flow (Bus interactions)
- Failure Modes (What can break)
- Telemetry (How to monitor)
- Delete Plan (How to remove)

## Project Templates

### Svelte + TypeScript Template

**Features**:
- LEGO directory structure pre-configured
- 4-bus architecture initialized
- Boss Rules ESLint configuration active
- Design-first workflow templates
- Vitest testing framework
- GitHub Actions CI/CD with branch protection

**File Structure**:
```
my-buda-project/
├── buda.config.js           # BUDA framework configuration
├── src/
│   ├── models/
│   ├── services/
│   ├── ui/
│   ├── wire/
│   └── buses/
├── docs/
│   ├── designs/             # Design documents
│   └── adrs/               # Architecture Decision Records
├── tools/
│   ├── check-design-doc.js  # Rule #1 enforcement
│   └── complexity-budget.js # Rule #5 enforcement
└── .github/
    └── workflows/ci.yml     # Rule #10 enforcement
```

## Configuration System

### `buda.config.js`

```javascript
export default {
  rules: {
    designThreshold: 50,        // LOC for design docs (Rule #1)
    testCoverage: 80,           // Coverage requirement (Rule #2) 
    deletePlan: true,           // Enforce delete plans (Rule #8)
    hardcodingAllowed: false,   // No hardcoding (Rule #7)
  },
  buses: {
    event: true,    // Enable EventBus
    state: true,    // Enable StateBus
    config: true,   // Enable ConfigBus  
    error: true,    // Enable ErrorBus
  },
  lego: {
    structure: ['models', 'services', 'ui', 'wire'],
    enforce: true   // Enforce LEGO placement
  },
  framework: 'svelte-ts',     // Target framework
  features: ['testing', 'ci'] // Additional features
};
```

## Development Workflow

### 1. Project Creation
```bash
npx @buda/cli create my-app
cd my-app
npm run dev
```

### 2. Feature Development
```bash
# Design first (Rule #1)
buda design user-authentication

# Generate components (Rule #3)
buda generate model User
buda generate service AuthService  
buda generate ui LoginForm

# Implement with TDD (Rule #2)
npm run test -- --watch

# Check compliance (All Rules)
buda audit
```

### 3. Feature Deletion  
```bash
# Simulate deletion (Rule #8)
buda delete user-authentication --simulate

# Actual deletion if simulation passes
buda delete user-authentication --confirm
```

## Quality Gates

### Pre-commit Hooks
- Design document check for >50 LOC changes
- ESLint Boss Rules validation
- Test coverage threshold enforcement
- Complexity budget validation

### CI/CD Pipeline  
- All Boss Rules ESLint checks
- Test coverage reporting
- Design document validation
- Deployment only on Boss Rules compliance

### Branch Protection
- Required PR reviews with CODEOWNERS
- Status checks must pass
- No direct pushes to main
- Conversation resolution required

## Metrics & Monitoring

### Built-in Instrumentation
- Bus communication metrics
- Component lifecycle tracking
- Error aggregation and reporting
- Performance monitoring hooks

### Development Metrics
- Design document coverage
- Test coverage trends
- Complexity budget adherence
- Delete plan execution time

---

## Benefits Summary

**For Individual Developers**:
- Consistent architecture across projects
- Quality gates prevent common mistakes
- Rapid component scaffolding
- Built-in design workflow

**For Teams**:
- Standardized development practices
- Easy onboarding with familiar patterns
- Automated quality assurance
- Knowledge sharing through design docs

**For Organizations**:
- Engineering discipline at scale
- Reduced technical debt
- Consistent code quality
- Risk mitigation through delete-by-design

BUDA transforms software development from ad-hoc practices into systematic, disciplined engineering through comprehensive tooling and architecture patterns.