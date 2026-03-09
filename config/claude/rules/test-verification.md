# Test Verification

After any non-trivial refactor, feature addition, or multi-file change, always run the relevant test suite before considering the work complete. Don't skip this even if you're confident the changes are correct — tests catch things you don't expect.

- Run unit/integration tests after backend changes
- Run e2e tests after frontend changes
- If tests fail, investigate and fix before moving on
- Distinguish between pre-existing failures and failures caused by your changes
