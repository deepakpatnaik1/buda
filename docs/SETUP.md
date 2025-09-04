# BUDA Setup Guide

## Quick Start

```bash
# 1. Copy the template
cp -r /path/to/buda/template my-project
cd my-project

# 2. Customize project details
# Edit package.json: replace {{PROJECT_NAME}} and {{PROJECT_DESCRIPTION}}

# 3. Install dependencies and initialize
npm run boss:init

# 4. Verify setup
npm run boss:validate

# 5. Start developing!
npm run dev
```

## What BUDA Sets Up

### 🏗️ Architecture Foundation

- **4-Bus System**: Event, State, Config, Error buses with TypeScript contracts
- **LEGO Structure**: Modular `models/`, `services/`, `ui/`, `wire/` architecture  
- **Template Components**: Base classes for each LEGO layer
- **Deletion-Ready**: All components include proper teardown methods

### 🔧 Development Tools

- **Complexity Budget**: Enforces ≤400 LOC, ≤2 interfaces, ≤1 bus topic per PR
- **Deletion Simulation**: Tests architectural coupling by randomly deleting modules
- **Custom ESLint**: Boss Rules validation (no-hardcoding, lego-placement, etc.)
- **Design Doc Checker**: Validates design-before-code workflow

### 📋 Process Automation

- **CI Pipeline**: Lint, test, budget, and design doc validation
- **PR Template**: Boss Rules checklist for every pull request  
- **Test Setup**: Vitest with 90% coverage thresholds and architectural tests
- **Git Hooks**: Pre-commit validation via Husky

### 🧪 Quality Assurance

- **Bus Contract Tests**: Validates publisher/subscriber relationships
- **Architectural Compliance**: Tests LEGO separation and coupling
- **Coverage Monitoring**: Tracks test coverage trends
- **Flaky Test Detection**: Identifies and eliminates unstable tests

## Available Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run preview         # Preview build

# Quality Assurance  
npm run lint            # Run ESLint with Boss Rules
npm run test            # Run test suite
npm run test:coverage   # Generate coverage report

# Boss Rules Tools
npm run budget          # Check complexity budget
npm run delete-simulation    # Test deletion resilience
npm run design-doc-check     # Validate design docs
npm run boss:validate   # Run all quality checks

# Shortcuts
npm run boss:init       # One-time setup
npm run boss:setup-hooks # Install git hooks
```

## Next Steps

1. **Read the Architecture Guide**: `docs/ARCHITECTURE.md`
2. **Follow the Development Workflow**: `docs/WORKFLOW.md`  
3. **Study the Examples**: `examples/`
4. **Customize Base Templates**: Adapt templates in `src/` to your domain

## Troubleshooting

**ESLint Plugin Issues**:
```bash
npm install ./tools/eslint-plugin-boss --save-dev
```

**Test Failures**:
```bash
npm run test:coverage  # Check what's not tested
npm run test:ui        # Interactive test debugging
```

**Budget Violations**:
```bash
npm run budget  # See complexity analysis
# Refactor files exceeding limits
```

---

*BUDA enforces engineering discipline through tooling, not documentation.*