# Plan Template

Standard structure for plan files.

> **File path convention:** `plans/<journey>/NN-<short-title>.md`

---

## Template

```markdown
# Plan NN: <Plan Title>

**Source:** `<requirements source>`
**Skills:** `<skill-1>`, `<skill-2>`
**Depends on:** Plan <NN> (<what it provides>), or "Nothing (first plan)"

---

## Objective

<!-- One paragraph: what does this plan achieve? -->

## Specification

<!-- Detailed design — tables, trees, pseudocode as needed -->

## Steps to Execute

1. **<Action>** using `<skill-name>`:
   <!-- Details -->

2. **Validate:**
   <!-- Validation step -->

## Acceptance Criteria

- [ ] <Testable condition 1>
- [ ] <Testable condition 2>

## Notes

<!-- Optional: Known issues, edge cases -->
```

---

## Conventions

| Rule | Description |
|------|-------------|
| **Scope** | Each plan targets a single workflow or feature |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10` |
| **Max per journey** | 10 plans |
| **Validate** | Every plan ends with a validate step |
