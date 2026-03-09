# Direnv

For projects that use direnv (indicated by a `.envrc` file in the project root), use `direnv exec .` to load environment variables when running scripts or commands that need them. Do not use `source .envrc.local` or manually export variables.

Example:
```bash
direnv exec . npx tsx scripts/my-script.ts
direnv exec . yarn test:e2e
```
