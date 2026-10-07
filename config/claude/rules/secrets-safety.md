# Secrets Safety

Never stage or commit files that contain secrets, API keys, tokens, or credentials. This includes but is not limited to:

- `env.local`, `.env.local`, `.env`, `.env.*`
- Any file containing API keys, tokens, passwords, or connection strings
- Credential files like `credentials.json`, `service-account.json`, etc.

Before committing, always review staged files for secrets. If a secrets file is staged, unstage it immediately and add it to `.gitignore` — don't just unstage it and leave it for the user to deal with.
