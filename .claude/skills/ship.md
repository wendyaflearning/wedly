# /ship — Prepare a feature branch and commit

## What this skill does

When invoked, guide the assistant through the full pre-push shipping workflow:

1. Determine the correct branch name from the current work
2. Create (or switch to) a `feature/...` branch
3. Stage all relevant files, excluding sensitive/local files
4. Draft and create the commit following the project convention
5. Stop before push — the user verifies before anything goes remote

---

## Instructions

### Step 1 — Determine branch name

Inspect the current working changes (`git status`, `git diff --stat`) to understand what was built. Propose a branch name following the pattern:

```
feature/<scope>-<short-description>
```

Examples:
- `feature/web-hero-landing`
- `feature/api-vendor-onboarding-step`
- `feature/web-navbar-logo`

Use kebab-case. Keep it under 50 characters. Use the app scope (`web`, `api`) as prefix when relevant.

Ask the user to confirm the branch name before creating it.

### Step 2 — Create the branch

```bash
git checkout -b feature/<name>
```

If the branch already exists locally, switch to it instead:

```bash
git checkout feature/<name>
```

### Step 3 — Stage files

Run `git status` to list all modified/untracked files.

Stage all files **except**:
- `.env*` (any `.env`, `.env.local`, `.env.*.local`)
- `*.local.*` (e.g., `settings.local.json`)
- `*.local` files
- `node_modules/`
- `.next/`
- `dist/`
- `var/` (Symfony cache/logs)

Stage explicitly by file path — never use `git add -A` or `git add .` blindly. List each file you are about to stage and confirm it makes sense.

```bash
git add path/to/file1 path/to/file2 ...
```

### Step 4 — Draft the commit message

Follow the project convention:

```
<type>(<scope>): <description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`

Scope: the area changed (e.g., `web-hero`, `api-onboarding`, `navbar`)

Description: imperative mood, under 72 characters, always in English.

Show the draft message to the user before committing.

### Step 5 — Create the commit

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 6 — Stop and report

After the commit succeeds, show:
- The branch name
- The commit hash (`git log -1 --oneline`)
- The files included

Then stop. Do NOT push. Tell the user:

> Commit prêt. Vérifie avec `git log -1` puis lance `git push -u origin <branch>` quand tu es prêt.
