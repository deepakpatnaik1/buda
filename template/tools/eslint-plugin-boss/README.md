# ESLint Plugin Boss

Custom ESLint plugin to enforce the Essential Boss Rules for clean, maintainable architecture.

## Rules

### `boss/no-hardcoding` (Rule 7: No hardcoding)

Prevents magic numbers and hardcoded strings. Encourages use of config bus or environment variables.

**❌ Bad:**
```javascript
const timeout = 5000; // Magic number
const apiUrl = "https://api.example.com"; // Hardcoded string
```

**✅ Good:**
```javascript
const timeout = configBus.get('timeout');
const apiUrl = process.env.API_URL;
const count = 0; // Allowed numbers: 0, 1, -1
```

### `boss/lego-placement` (Rule 3: LEGO features)

Enforces LEGO architecture file placement and naming conventions.

**Files must be in one of these directories:**
- `models/` - Data models (must include "Model" in filename)
- `services/` - Business logic (must include "Service" in filename) 
- `ui/` - UI components (.svelte files allowed)
- `wire/` - Coordinators (must include "Wire" in filename)
- `buses/` - Event/state/config buses (must include "Bus" in filename)

### `boss/be-svelte-y` (Rule 6: Be Svelte-y)

Enforces Svelte best practices and TypeScript usage.

**Requirements:**
- Svelte components must use `lang="ts"` 
- Component filenames should be PascalCase
- Prefer reactive statements (`$:`) over `onMount` side effects
- Use proper Svelte directives (`bind:`, `on:`)

### `boss/thin-wrapper` (Rule 5: Thin wrappers only)

Ensures wrapper/adapter files contain only imports, exports, types, and simple guards.

**Applies to files containing:** `wrapper`, `adapter`, `guard`, `logger` in filename

**Maximum complexity:** 3 per function
**No business logic allowed** - only typing, logging, and validation

## Configuration

Add to your `.eslintrc.cjs`:

```javascript
module.exports = {
  plugins: ['boss'], // Requires local plugin installation
  rules: {
    'boss/no-hardcoding': ['error', {
      allowedNumbers: [0, 1, -1, 2, 10, 100, 1000],
      allowedStrings: ['', 'test', 'dev', 'prod'],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true
    }],
    'boss/lego-placement': ['error'],
    'boss/be-svelte-y': ['warn', {
      requireTypeScript: true,
      preferReactiveStatements: true,
      requireComponentNaming: true  
    }],
    'boss/thin-wrapper': ['error', {
      maxComplexity: 3
    }]
  }
};
```

## Testing

Run the rule tests:

```bash
cd tools/eslint-plugin-boss
node tests/rules/no-hardcoding.test.js
```

## Boss Rules Mapping

| Boss Rule | ESLint Rule | Automation Level |
|-----------|-------------|------------------|
| Rule 1: Design before code | Manual review (CODEOWNERS) | Human |
| Rule 2: TDD | Coverage gates + pre-push hooks | CI |
| Rule 3: LEGO features | `boss/lego-placement` | Lint |
| Rule 4: Decouple with buses | Contract testing | CI |
| Rule 5: Thin wrappers only | `boss/thin-wrapper` | Lint |
| Rule 6: Be Svelte-y | `boss/be-svelte-y` | Lint |
| Rule 7: No hardcoding | `boss/no-hardcoding` | Lint |
| Rule 8: Design for deletion | Deletion simulation | CI |
| Rule 9: Instrument everything | Static analysis | CI |
| Rule 10: Guard main | Branch protection + CODEOWNERS | GitHub |
