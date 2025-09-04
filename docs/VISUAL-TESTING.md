# BUDA Visual Testing Guide

BUDA provides comprehensive visual testing capabilities that combine **custom Puppeteer tooling** with **MCP integration** for complete UI validation and debugging.

## Quick Start

```bash
# Create new BUDA project with visual testing
./scripts/create-project.sh my-app
cd my-app

# Start development server  
npm run dev

# In another terminal: Capture screenshots + console logs
npm run test:visual

# View results in ../my-app-docs/puppeteer/
```

## What Visual Testing Provides

### 🔍 **UI Validation**
- Screenshots of full pages and individual components
- Visual regression detection across deployments  
- Proof that Boss Rules architecture works in the UI

### 🐛 **Debug Context**  
- Complete console log capture with timestamps
- Page error detection and logging
- Network activity monitoring

### 📊 **Historical Tracking**
- Timestamped sessions: `2025-01-15_14-30-22-123Z/`
- Side-by-side comparison of UI changes over time
- Evidence of deletion simulation results

## Architecture Integration

### Boss Rules Compliance

**Rule #2 (Test-Driven Development)**:
```bash
# Visual tests validate UI implementation
npm run test:visual        # Take baseline screenshots
# Make UI changes
npm run test:visual        # Compare new screenshots
# Verify visual changes match requirements
```

**Rule #8 (Design for Deletion)**:
```bash
# Test deletion resilience with visual proof
npm run delete-simulation  # Remove modules randomly
npm run test:visual        # Capture broken UI state  
# Verify system gracefully handles missing components
```

**Rule #9 (Instrument Everything)**:
```bash
# Every UI interaction is logged with context
npm run test:visual
# Check ../project-docs/puppeteer/latest/console-logs.txt
# All console messages, errors, and timing captured
```

### LEGO Architecture Validation

Visual testing proves LEGO modular architecture works:

```typescript
// Each component tested in isolation
const scenarios = [
  { name: 'input-area', selector: '.input-bar' },      // Service + UI
  { name: 'content-area', selector: '.main-content' }, // Model + UI  
  { name: 'navigation', selector: 'nav' }              // Wire coordination
];
```

### 4-Bus System Evidence

Console logs show bus communications:
```
[INFO] EventBus: theme:request published
[INFO] ConfigBus: Loading theme-config.json  
[INFO] StateBus: theme-state updated
[INFO] ErrorBus: No errors detected
```

## Dual-Mode Testing Strategy

### Mode 1: Custom Puppeteer (Automated)

**When to use**: CI/CD, regression testing, documentation

```bash
npm run test:visual              # Basic visual testing
npm run boss:validate-ui         # Visual + Boss Rules validation
UI_TEST_BASE_URL=:3002 npm run test:visual  # Custom config
```

**Output Structure**:
```
../my-project-docs/puppeteer/
├── 2025-01-15_09-15-30-123Z/    # Session timestamp (ISO 8601)
│   ├── full-page.png            # Complete application
│   ├── input-area.png           # Input components
│   ├── content-area.png         # Main content
│   ├── navigation.png           # Navigation elements  
│   └── console-logs.txt         # All browser output
└── 2025-01-15_14-22-15-456Z/    # Next session
    └── ...
```

### Mode 2: MCP Puppeteer (Interactive)

**When to use**: Development, debugging, Claude collaboration

```typescript
// Claude can directly access:
- screenshot://my-test           // Captured screenshots
- console://logs                // Browser console output
```

**Workflow**:
1. Developer: "Claude, take a screenshot of the homepage"  
2. Claude: Uses MCP Puppeteer to capture screenshot
3. Claude: Analyzes screenshot for Boss Rules compliance
4. Both Claudes: Collaborate on UI improvements with visual context

## Environment Configuration

### Default Settings (Boss Rule #7: No Hardcoding)

```bash
# All settings configurable via environment
UI_TEST_BASE_URL=http://localhost:5173    # Development server
UI_TEST_WIDTH=1920                        # Browser width
UI_TEST_HEIGHT=1080                       # Browser height
```

### CI/CD Integration

```yaml
# .github/workflows/visual-testing.yml  
name: Visual Testing
on: [pull_request]
jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
        
      - name: Start application
        run: npm run dev &
        
      - name: Wait for server
        run: sleep 5
        
      - name: Run visual tests
        run: npm run test:visual
        env:
          UI_TEST_BASE_URL: http://localhost:5173
          
      - name: Upload visual artifacts
        uses: actions/upload-artifact@v3
        with:
          name: visual-test-results
          path: ../*-docs/puppeteer/
```

## Customization

### Project-Specific Scenarios

```typescript
// Edit tools/ui-test-capture.ts
const CONFIG = {
  scenarios: [
    // BUDA defaults
    { name: 'full-page', path: '/', selector: null },
    { name: 'input-area', path: '/', selector: '.input-bar' },
    
    // Add your own
    {
      name: 'user-profile',
      path: '/profile',  
      description: 'User profile page',
      selector: '.profile-content'
    },
    {
      name: 'modal-test',
      path: '/settings',
      description: 'Settings modal interaction', 
      selector: '.modal',
      actions: [
        { type: 'click', selector: '.open-modal-btn' }
      ]
    }
  ]
};
```

### Different Frameworks

```typescript
// For React projects, update selectors:
const scenarios = [
  { name: 'app-root', selector: '#root' },
  { name: 'header', selector: '[data-testid="header"]' },
  { name: 'main-content', selector: '[data-testid="content"]' }
];

// For Vue projects:
const scenarios = [
  { name: 'app-root', selector: '#app' },  
  { name: 'navigation', selector: '.nav-component' },
  { name: 'router-view', selector: 'router-view' }
];
```

## Integration with Boss Rules Tools

### Complexity Budget + Visual Testing
```bash
npm run budget              # Check code complexity
npm run test:visual         # Verify UI still works
# Complex code often breaks UI - this catches it
```

### Deletion Simulation + Visual Testing  
```bash
npm run delete-simulation   # Randomly delete modules
npm run test:visual         # See what broke visually
# Perfect for testing loose coupling
```

### Design Doc Validation + Visual Testing
```bash
npm run design-doc-check    # Validate design exists
npm run test:visual         # Prove design was implemented
# Visual evidence that design was followed
```

## Best Practices

### Development Workflow
1. **Baseline**: `npm run test:visual` before changes
2. **Develop**: Make UI changes following Boss Rules  
3. **Validate**: `npm run test:visual` after changes
4. **Compare**: Review timestamped folders for differences
5. **Commit**: Include visual evidence in PR description

### CI/CD Integration
1. **Always** run visual tests in CI pipeline
2. **Store** artifacts for debugging failed builds  
3. **Compare** screenshots across deployments
4. **Alert** on significant visual changes

### MCP Claude Collaboration  
1. **Development**: Use MCP for immediate feedback
2. **Review**: Share screenshots between Claudes
3. **Debug**: Console logs provide troubleshooting context
4. **Iterate**: Visual feedback drives rapid development

### Boss Rules Enforcement
1. **Rule #2**: Visual tests drive UI development
2. **Rule #8**: Deletion simulation uses visual proof
3. **Rule #9**: All UI interactions logged and timestamped  
4. **Process**: Visual evidence in every PR

## Troubleshooting

### Common Issues

**Server not running**:
```bash
# Start dev server first
npm run dev &
sleep 5
npm run test:visual
```

**Wrong port**:
```bash
UI_TEST_BASE_URL=http://localhost:3002 npm run test:visual
```

**Screenshots empty**:
```bash
# Check selectors match your components
# Edit tools/ui-test-capture.ts CONFIG.scenarios
```

**MCP not working**:
```bash
# Ensure MCP Puppeteer server installed separately
# Check Claude Desktop MCP configuration
```

---

*BUDA visual testing provides evidence that Boss Rules architecture delivers working, beautiful UIs.*