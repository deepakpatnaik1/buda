# BUDA Development Workflow

This workflow enforces the Essential Boss Rules through process automation, not developer discipline.

## Feature Development Process

### 1. Design Before Code (Rule #1)

```bash
# Create design document
cp designs/TEMPLATE.md designs/draft/2025-01-15-my-feature.md
# Edit the design document with:
# - Interface definitions  
# - Data flow diagrams
# - Failure modes
# - Rollout plan

# Check design requirements
npm run design-doc-check
```

**Design Doc Structure:**
- **Problem**: What are we solving?
- **Solution**: High-level approach
- **Interfaces**: API/event contracts  
- **Data Flow**: Bus communication patterns
- **Failure Modes**: What can go wrong?
- **Rollout**: Deployment strategy
- **Delete Plan**: How to remove this feature

### 2. Test-Driven Development (Rule #2)

```bash
# Write failing tests first
touch src/services/MyFeature.test.ts
# Write IO-pair tests that fail
# No mocks for not-yet-existing code

npm run test  # Should fail
```

**Test Categories:**
- **Unit Tests**: Service logic with real buses
- **Integration Tests**: Full feature workflows  
- **Bus Contract Tests**: Publisher/subscriber validation
- **Architectural Tests**: LEGO compliance

### 3. Implement LEGO Features (Rule #3)

Follow the 4-layer pattern:

```bash
# 1. Model (data structure)
touch src/models/MyFeatureModel.ts
# Define interfaces, validation, defaults

# 2. Service (business logic)  
touch src/services/MyFeatureService.ts
# Stateless logic using buses only

# 3. UI (component)
touch src/ui/MyFeatureComponent.svelte
# EventBus communication, Svelte patterns

# 4. Wire (coordinator)
touch src/wire/MyFeatureWire.ts  
# Connects model, service, UI via buses
```

### 4. Bus Communication (Rule #4)

Define event contracts:

```typescript
// src/buses/schemas/myFeature.ts
export const myFeatureEventContracts = {
  'myFeature:request': {
    publishers: ['MyFeatureComponent.svelte'],
    subscribers: ['MyFeatureWire.ts']
  },
  'myFeature:updated': {
    publishers: ['MyFeatureWire.ts'],
    subscribers: ['MyFeatureComponent.svelte']
  }
};
```

### 5. Quality Validation

```bash
# Check complexity budget (Rule: ≤400 LOC, ≤2 interfaces, ≤1 bus topic)
npm run budget

# Test deletion resilience (Rule #8) 
npm run delete-simulation

# Validate all rules
npm run boss:validate
```

### 6. Pull Request

The PR template enforces Boss Rules compliance:

- [ ] **Design-First**: Design doc created and approved for features >200 LOC
- [ ] **LEGO features**: New model/service/UI/wire components properly separated  
- [ ] **No hard-coding**: Configuration externalized, no redundancy introduced
- [ ] **CI passes**: lint, budget, design-doc-check, tests, coverage
- [ ] **CODEOWNERS review**: Requested for guarded paths (/wire/, /buses/, /designs/)

## Automation Safeguards

### Pre-commit Hooks
```bash
# Runs automatically on git commit
npm run lint        # ESLint with Boss Rules
npm run budget      # Complexity validation  
npm run test:run    # Quick test suite
```

### CI Pipeline
```bash
# Runs on every PR  
npm run design-doc-check    # Design doc validation
npm run lint               # Code quality
npm run budget             # Complexity limits
npm run test:coverage      # Full test suite with coverage
```

### Branch Protection
- **main** branch requires:
  - PR review from CODEOWNERS
  - All CI checks passing
  - No direct pushes allowed

## Boss Rules Enforcement

### Rule #1 - Design Before Code
- `design-doc-checker.ts` blocks PRs >200 LOC without approved design docs
- Design template provides structure for architectural decisions

### Rule #2 - Test-Driven Development  
- CI fails without tests
- Coverage thresholds: 90% lines, 85% branches
- No mocks for business logic

### Rule #3 - LEGO Features
- ESLint rules enforce proper file placement
- Architectural tests validate separation
- Template components guide implementation

### Rule #4 - Bus Decoupling
- Bus contract tests validate pub/sub relationships
- ESLint prevents direct cross-layer imports  
- Schema validation ensures type safety

### Rule #7 - No Hardcoding
- Custom ESLint rule detects hardcoded values
- ConfigBus enforces external configuration
- Schema validation for all config

### Rule #8 - Design for Deletion
- Deletion simulation randomly removes modules and tests build
- All components must implement `dispose()` methods
- Kill-switch flags with expiry dates

### Rule #9 - Instrument Everything
- ErrorBus catches and logs all errors
- Context included in all logging
- No silent failures allowed

## Common Workflows

### Adding a New Feature
1. `npm run design-doc-check` - Verify design requirements
2. Create failing tests first  
3. Implement Model → Service → UI → Wire
4. `npm run boss:validate` - Check all rules
5. Submit PR with Boss Rules checklist

### Debugging Issues
1. `npm run test:ui` - Interactive test debugging
2. Check ErrorBus logs for context
3. `npm run budget` - Identify complexity issues
4. `npm run delete-simulation` - Test coupling

### Refactoring Code
1. Tests must pass before and after
2. `npm run budget` - Stay within complexity limits
3. `npm run delete-simulation` - Ensure no new coupling
4. Update bus contracts if events change

---

*This workflow prevents architectural debt through automation, not documentation.*