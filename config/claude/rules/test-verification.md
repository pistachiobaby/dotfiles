# Test Verification

## Writing Tests

When implementing any feature, refactor, or bug fix, always write tests for the new code if tests don't already exist. Features need to be tested as much as reasonably possible — don't consider work done until test coverage is in place.

- If the project has an existing test suite, add tests in the same style and location.
- Cover the happy path, edge cases, and failure modes.
- If existing tests don't cover the area you changed, add them proactively — don't wait to be asked.

## Running Tests

After any non-trivial refactor, feature addition, or multi-file change, always run the full relevant test suite before considering the work complete. This means:

1. Run the new tests you wrote to confirm they pass.
2. Run the full test suite to regression test — make sure you didn't break existing tests.
3. Don't skip this even if you're confident the changes are correct — tests catch things you don't expect.

- Run unit/integration tests after backend changes
- Run e2e tests after frontend changes
- If tests fail, investigate and fix before moving on
- Distinguish between pre-existing failures and failures caused by your changes
