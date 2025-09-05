# Design-First Workflow - Quick Start 🚀

## When do I need a design doc?

**Always required for:**
- ✅ Features >200 lines of code
- ✅ New LEGO components (models, services, UI, wire)
- ✅ Bus contract changes (EventBus, StateBus, ConfigBus, ErrorBus) 
- ✅ Breaking API changes
- ✅ Database schema changes
- ✅ Third-party integrations

**Not required for:**
- ❌ Bug fixes <50 LOC
- ❌ Refactoring existing code
- ❌ Documentation updates
- ❌ Configuration tweaks
- ❌ Test additions

## Quick Workflow

### 1. Create Design Doc
```bash
# Copy template to draft
cp designs/TEMPLATE.md designs/draft/2025-01-15-my-feature.md

# Edit with your favorite editor
code designs/draft/2025-01-15-my-feature.md
```

### 2. Fill Out Required Sections
**Minimum required (Boss will reject incomplete docs):**
- ✅ Problem Statement with success criteria
- ✅ LEGO Components breakdown (Rule #4)
- ✅ Bus Events & Data Flow
- ✅ Configuration requirements (Rule #8)
- ✅ Rollback plan (Rule #5) 
- ✅ Delete plan (Rule #8)

### 3. Submit for Review
```bash
# Create PR with design doc
git add designs/draft/2025-01-15-my-feature.md
git commit -m "Design: Add feature design document"
git push origin feature-branch

# Create PR with CLEAR reference to design doc in description
```

### 4. Get Boss Approval
- Boss reviews design for Essential Rules compliance
- Address feedback and iterate 
- Boss moves approved design to `designs/approved/`

### 5. Implement with Design Reference
```bash
# Reference design in implementation PRs
git commit -m "feat: implement user auth (designs/approved/2025-01-15-user-auth.md)"

# PR description should link to approved design
```

## CI Integration

The `design-doc-check` script runs automatically and will **fail your PR** if:
- ❌ Changes >200 LOC without design doc reference
- ❌ Bus changes without design doc
- ❌ Multiple LEGO components changed without design doc
- ❌ Referenced design doc doesn't exist
- ❌ Referenced design doc not approved (not in `approved/`)

## Pro Tips

### ✅ Good Design Doc Names
- `2025-01-15-llm-integration.md`
- `2025-01-20-real-time-chat.md`  
- `2025-02-01-user-authentication.md`

### ❌ Bad Design Doc Names
- `feature.md`
- `new-stuff.md`
- `design-doc.md`

### ✅ Good PR References
```
This PR implements designs/approved/2025-01-15-llm-integration.md

- Adds LLMModel with message handling
- Creates LLMService with API integration  
- Implements ChatUI component
- Adds LLMWire for orchestration
```

### ❌ Bad PR References
```
Added some new features
```

## Essential Boss Rules Integration

Every design doc enforces:

- **Rule #1**: Design-first approach before coding
- **Rule #3**: Thin wrapper services documented
- **Rule #3**: LEGO features (model + service + UI + coordinator) specified
- **Rule #6**: Existing solutions evaluated first  
- **Rule #7**: Boss guidance incorporated
- **Rule #8**: No hardcoding, configuration externalized
- **Rule #9**: Complete delete plan documented

## Common Mistakes

❌ **"I'll write the design doc after coding"**  
✅ **Design must be approved BEFORE implementation**

❌ **"This is just a small change"** (adds 300 LOC)  
✅ **Count your lines - >200 LOC = design doc required**

❌ **"The design is obvious from the code"**  
✅ **Design docs are for communication, not just documentation**

❌ **Reference draft design in implementation PR**  
✅ **Only reference approved designs (in approved/ directory)**

## Need Help?

1. **Template Issues**: Check `designs/TEMPLATE.md` for complete example
2. **CI Failures**: Run `npm run design-doc-check` locally first
3. **Boss Feedback**: Address ALL comments before expecting approval
4. **Complex Features**: Break into multiple smaller designs if >500 LOC

## Emergency Override

**Never skip design docs** - they enforce Essential Boss Rules and prevent architectural debt.

If you think your case is exceptional, discuss with Boss BEFORE implementing.
