# BUDA - Boss Rules Framework

**BUDA** (**B**oss R**u**les **D**evelopment **A**rchitecture) is a complete engineering framework that institutionalizes the Essential Boss Rules through tooling, process automation, and architectural patterns.

## What BUDA Provides

🏗️ **Architecture Patterns**
- 4-Bus system (Event, State, Config, Error buses)
- LEGO modular structure (models/, services/, ui/, wire/)
- Deletion-friendly design patterns
- TypeScript contracts and schemas

🔧 **Development Tools**
- Complexity budget enforcement
- Deletion simulation testing
- Custom ESLint rules for Boss Rules
- Design document validation

📋 **Process Automation**
- CI pipeline templates
- PR templates with Boss Rules checklist
- Test-driven development setup
- Coverage thresholds and quality gates

## Quick Start

```bash
# Clone BUDA template
cp -r /path/to/buda/template my-new-project
cd my-new-project

# Install dependencies
npm install

# Initialize Boss Rules
npm run boss:init

# Start developing with discipline!
npm run dev
```

## Core Principles

Based on the Essential Boss Rules:
1. **Design before code** + ask Boss
2. **Test-driven development**
3. **LEGO features** (deletable, isolated modules)
4. **Decouple with buses** (Event, State, Config, Error)
5. **Thin wrappers only**
6. **Be framework-idiomatic** (Svelte-y, React-y, etc.)
7. **No hardcoding**
8. **Design for deletion**
9. **Instrument everything**
10. **Guard main branch**

## Framework Components

- `template/` - Complete project template
- `tools/` - Reusable development tools
- `docs/` - Documentation and guides  
- `examples/` - Reference implementations

---

*BUDA enforces engineering discipline through tooling, not documentation.*