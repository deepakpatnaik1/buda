# Branch Protection Configuration

## Required Settings for Main Branch

Navigate to: Repository Settings → Branches → Add rule for `main`

### ✅ Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- Status checks: **CI** (matches workflow name in ci.yml)

### ✅ Required Reviews  
- [x] Require pull request reviews before merging
- [x] Require review from code owners (CODEOWNERS enforced)
- Required approving reviews: **1**

### ✅ Additional Protections
- [x] Restrict pushes that create files to main
- [x] Do not allow bypassing the above settings
- [x] Include administrators (Boss Rules apply to everyone)

## Verification
Once configured, PRs will require:
1. ✅ CI pipeline passing (lint → budget → test → coverage)  
2. ✅ Boss approval for /wire, /buses, /designs, *.config.* changes
3. ✅ Boss Rules checklist completion

This enforces Rule 10: Guard Main against complexity violations and rule bypasses.
