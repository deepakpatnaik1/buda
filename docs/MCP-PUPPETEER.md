# MCP Puppeteer + BUDA Integration Guide

BUDA provides both **MCP Puppeteer integration** and **custom Puppeteer tooling** for comprehensive visual testing and UI validation.

## Two-Tier Visual Testing Strategy

### 1. MCP Puppeteer (Interactive Development)
**Best for**: Real-time debugging, collaborative review, immediate feedback

```typescript
// Claude can directly access:
console://logs          // Browser console output
screenshot://<name>      // Captured screenshots
```

**Use Cases:**
- ✅ Debugging during development with Claude
- ✅ Getting immediate visual feedback on changes
- ✅ Collaborative review between Coder Claude and Reviewer Claude
- ✅ Interactive testing of specific UI states

### 2. Custom Puppeteer Tools (Automated Testing)
**Best for**: CI/CD, regression testing, documentation generation

```bash
npm run test:visual      # Automated screenshot + console capture
npm run boss:validate-ui # Visual testing + Boss Rules validation
```

**Use Cases:**  
- ✅ Automated visual regression testing
- ✅ CI pipeline integration
- ✅ Historical UI change documentation
- ✅ Performance monitoring via console logs

## Integration Workflow

### Development Phase
1. **Interactive Testing** with MCP Puppeteer
   - Take screenshots: `puppeteer_screenshot "homepage"`
   - Read console logs: Access `console://logs` resource
   - Get immediate Claude feedback on visual issues

2. **Automated Documentation** with Custom Tools
   - Run `npm run test:visual` 
   - Generates timestamped folders: `../project-docs/puppeteer/2025-01-15_14-30-22-123Z/`
   - Creates comprehensive test artifacts

### CI/CD Integration
```yaml
# .github/workflows/ci.yml
- name: Visual Testing
  run: |
    npm run dev &
    sleep 5  # Wait for server startup
    npm run test:visual
    
- name: Upload Visual Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: visual-test-results
    path: ../*-docs/puppeteer/
```

## BUDA Framework Integration

### Automatic Project Detection
```typescript
// tools/ui-test-capture.ts automatically detects:
const projectName = projectRoot.split('/').pop(); // e.g., "my-app"
const outputDir = `../${projectName}-docs/puppeteer/`; // e.g., "../my-app-docs/puppeteer/"
```

### Boss Rules Compliance

**Rule #7 (No Hardcoding)**:
```bash
# All configuration via environment variables
UI_TEST_BASE_URL=http://localhost:3002 npm run test:visual
UI_TEST_WIDTH=1440 UI_TEST_HEIGHT=900 npm run test:visual
```

**Rule #9 (Instrument Everything)**:
- All console messages captured with timestamps
- Page errors automatically logged
- Visual evidence stored for debugging

**Rule #2 (Test-Driven Development)**:
```typescript
// Visual tests can drive UI development
test('should display theme switcher correctly', async () => {
  await page.goto('/');
  const screenshot = await page.screenshot();
  expect(screenshot).toMatchVisualSnapshot('theme-switcher.png');
});
```

## Environment Setup

### Prerequisites
```bash
# BUDA projects come with Puppeteer pre-configured
npm run boss:init  # Installs all dependencies including Puppeteer
```

### MCP Puppeteer Setup
1. Install MCP Puppeteer server (separate from BUDA)
2. Configure Claude Desktop to use MCP Puppeteer
3. Both Claudes can access screenshots and console logs

### Custom Tool Configuration
```bash
# Default configuration (works out of the box)
npm run test:visual

# Custom configuration
UI_TEST_BASE_URL=http://localhost:3002 \
UI_TEST_WIDTH=1440 \
UI_TEST_HEIGHT=900 \
npm run test:visual
```

## File Structure

```
my-project/
├── tools/
│   └── ui-test-capture.ts        # Custom Puppeteer tool
├── package.json                  # Includes visual testing scripts
└── ../my-project-docs/
    └── puppeteer/               # Visual test artifacts
        ├── 2025-01-15_09-30-15-123Z/
        │   ├── full-page.png
        │   ├── input-area.png
        │   ├── content-area.png
        │   └── console-logs.txt
        └── 2025-01-15_14-22-33-456Z/
            └── ...
```

## Customization

### Extend Test Scenarios
```typescript
// In tools/ui-test-capture.ts
const CONFIG = {
  scenarios: [
    // Default BUDA scenarios
    { name: 'full-page', path: '/', selector: null },
    
    // Add project-specific scenarios  
    {
      name: 'user-dashboard',
      path: '/dashboard',
      description: 'User dashboard page',
      selector: '.dashboard-content'
    },
    {
      name: 'modal-dialog',
      path: '/settings',
      description: 'Settings modal',
      selector: '.modal',
      actions: [
        { type: 'click', selector: '.settings-button' }
      ]
    }
  ]
};
```

### MCP Integration Points
```typescript
// Claude can access these resources:
const consoleResource = 'console://logs';
const screenshotResource = 'screenshot://homepage-test';

// Custom tools save to predictable locations for Claude to read
const screenshotPath = '../project-docs/puppeteer/latest/full-page.png';
```

## Best Practices

### During Development
1. Use **MCP Puppeteer** for immediate feedback
2. Run `npm run test:visual` before commits
3. Review visual changes in timestamped folders
4. Include screenshots in PR descriptions

### In CI/CD  
1. Always run visual tests in headless mode
2. Store artifacts for debugging failed builds
3. Compare screenshots across deployments
4. Use visual diffs to catch regressions

### Boss Rules Compliance
1. **No hardcoded URLs** - Use environment variables
2. **Instrument everything** - Capture console logs  
3. **Design for deletion** - Visual tests validate module removal
4. **Test-driven** - Visual tests can drive UI development

---

*BUDA's dual-tier visual testing provides both interactive development support and automated quality assurance.*