# BUDA Framework 🎯

**Boss Rules Development Architecture**

A comprehensive development framework that institutionalizes engineering discipline through the 10 Essential Boss Rules.

## What is BUDA?

BUDA is a complete development framework that transforms software engineering from ad-hoc practices into disciplined, systematic development through:

- **10 Essential Boss Rules** - Architectural principles that enforce quality
- **4-Bus Architecture** - Event/State/Config/Error decoupling 
- **LEGO Components** - Model/Service/UI/Wire modularity
- **Design-First Workflow** - Required design docs for non-trivial changes
- **Delete-by-Design** - 30-minute feature deletion capability

## Quick Start

```bash
# Install BUDA CLI
npm install -g @buda/cli

# Create new project with Boss Rules baked in
npx @buda/cli create my-app

# Generate LEGO components
buda generate model User
buda generate service UserService
buda generate ui UserCard

# Design-first workflow
buda design user-authentication
buda implement user-authentication

# Compliance auditing
buda audit
buda delete user-authentication --simulate
```

## The 10 Essential Boss Rules

1. **Design Before Code** - Required design docs for >50 LOC changes
2. **TDD** - Tests written before implementation
3. **LEGO Features** - Modular components in models/services/ui/wire
4. **Decouple with Buses** - 4-bus architecture for clean separation
5. **Thin Wrappers** - Adapters contain only typing, logging, guards
6. **Framework Idiomatic** - Use framework patterns (Svelte-y, React-y, etc)
7. **No Hardcoding** - Configuration via environment/config bus
8. **Design for Deletion** - 30-minute feature removal capability
9. **Instrument Everything** - Logging, metrics, tracing built-in
10. **Guard Main** - Branch protection and review enforcement

## Architecture

### 4-Bus System

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

### LEGO Directory Structure

```
src/
├── models/          # Data models and schemas
├── services/        # Business logic and API calls  
├── ui/             # User interface components
├── wire/           # Coordination and orchestration
└── buses/          # Bus implementations
    ├── EventBus.ts
    ├── StateBus.ts  
    ├── ConfigBus.ts
    └── ErrorBus.ts
```

## Framework Components

- **@buda/cli** - Command-line interface for project management
- **@buda/eslint-plugin** - Boss Rules enforcement through linting
- **@buda/buses** - 4-bus architecture implementation
- **@buda/lego** - Component scaffolding and generation
- **@buda/templates** - Project templates with Boss Rules
- **@buda/testing** - Testing utilities and frameworks
- **@buda/design-first** - Design document workflow tools

## Benefits

### For Developers
- **Consistent Architecture** - Same patterns across all projects
- **Quality Gates** - Automatic enforcement of best practices
- **Rapid Scaffolding** - Generate components following LEGO patterns
- **Design-First** - Built-in design document workflow

### For Teams
- **Standardized Practices** - Everyone follows the same rules
- **Onboarding Speed** - New developers learn one system
- **Quality Assurance** - Boss Rules prevent common mistakes
- **Technical Debt Prevention** - Delete-by-design keeps code clean

### For Organizations
- **Engineering Discipline** - Systematic approach to development
- **Code Quality** - Consistent standards across teams
- **Maintainability** - Modular architecture enables easy changes
- **Risk Mitigation** - 30-minute deletion limits blast radius

## Getting Started

1. **Install**: `npm install -g @buda/cli`
2. **Create**: `buda create my-project`
3. **Develop**: Follow Boss Rules with built-in enforcement
4. **Deploy**: Use provided CI/CD templates

## Philosophy

BUDA is built on the principle that **engineering discipline beats individual brilliance**. By institutionalizing best practices through tooling and architecture, teams deliver higher quality software with less effort.

The framework removes decision fatigue around architecture choices and provides proven patterns that scale from solo projects to enterprise applications.

---

**BUDA**: Where engineering discipline meets developer productivity.