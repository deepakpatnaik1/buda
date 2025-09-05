# Design-First Workflow 📋

This directory contains design documents for major features (>200 LOC) as required by **Essential Boss Rule #1**.

## Directory Structure

```
designs/
├── README.md                    # This file
├── TEMPLATE.md                  # Standard design doc template
├── approved/                    # Approved designs ready for implementation
├── draft/                       # Work-in-progress designs
├── implemented/                 # Completed designs (archived)
└── rejected/                    # Rejected designs (for reference)
```

## Design-First Requirements

### When Design Doc Required
- **Any feature >200 lines of code**
- **New LEGO components** (models, services, UI, wire)
- **Bus contract changes** (EventBus, StateBus, ConfigBus, ErrorBus)
- **Breaking changes** to existing APIs
- **Database schema changes**
- **Third-party integrations**

### Workflow Process

1. **Draft Phase**: Create design doc in `draft/` using `TEMPLATE.md`
2. **Review Phase**: Submit PR with design doc for Boss review
3. **Approval Phase**: Move approved design to `approved/`
4. **Implementation Phase**: Reference design doc in implementation PRs
5. **Completion Phase**: Move to `implemented/` when feature complete

### CI Integration

- **PR checks** enforce design doc links for major features
- **CODEOWNERS** ensures Boss reviews all design docs
- **Branch protection** prevents merge without design review

## Essential Boss Rules Enforcement

- **Rule #1**: Design-first, think before coding
- **Rule #3**: LEGO features separation documented upfront
- **Rule #8**: No hardcoding - configuration specified in design
- **Rule #9**: Delete plan required for every new feature

## Naming Convention

`YYYY-MM-DD-feature-name.md`

Example: `2025-01-15-llm-integration.md`
