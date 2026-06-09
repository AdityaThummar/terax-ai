---
name: pull-commit-push
description: Pull latest changes, generate a commit message following terax-ai's scoped Conventional Commit conventions, commit, then ask before pushing. Use when the user wants to commit and push their current changes.
---

# Pull → Commit → Push (terax-ai)

Automate the pull/commit/push workflow for the **terax-ai** repo, following the
scoped Conventional Commit style visible in `git log`:
`type(scope): concise subject`.

**Allowed types:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `ci`, `perf`
**Common scopes (from history):** `ai`, `terminal`, `editor`, `tabs`, `fs`, `git`,
`shortcuts`, `source-control`, `pty`, `common`, `release`. Scope is optional for
repo-wide changes (e.g. `ci:`, `docs:`, `chore(release):`).

## Arguments

$ARGUMENTS

Optional commit message hint (short description or ticket/PR reference). If
omitted, derive the message entirely from the diff.

---

## Workflow

### Step 1: Pull latest changes
Run `git pull` on the current branch. If it produces merge conflicts, **stop
immediately**, list the conflicting files, and wait for the user to resolve them.

### Step 2: Inspect the working tree (run in parallel)
- `git status` — staged/unstaged/untracked changes
- `git diff HEAD` — understand what actually changed
- `git log --oneline -10` — match the existing scoped-commit style

If the tree is clean (nothing to commit), inform the user and stop — no empty commit.

### Step 3: Ask which changes to include
Present the changed/untracked files from `git status` and ask:
> **Which changes should I include in this commit?**
> 1. Only this chat's changes — I'll tell you which files
> 2. All changes (everything in `git status`)

- Option 1: wait for the user to name the files; stage only those.
- Option 2: stage all appropriate modified/untracked files (skip `.env`, secrets,
  large binaries, build output like `dist/` and `src-tauri/target/`).

### Step 4: Draft the commit message
Format: `type(scope): subject`
- Imperative, present tense (`add`, `fix`, `update`, `remove`, `implement`…).
- Concise single line; pick the scope from the dirs touched (e.g. changes under
  `src/modules/tabs/` → `tabs`). Omit scope only for repo-wide changes.
- Incorporate the `$ARGUMENTS` hint if provided; append a `(#PR)` ref if the user
  gives one.
- No body text.

Always append the trailer on its own line:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

### Step 5: Stage and commit
Stage only the Step-3 files, then commit via HEREDOC to preserve formatting:
```bash
git add <relevant files>
git commit -m "$(cat <<'EOF'
type(scope): subject

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```
If the commit fails (e.g. a hook error), fix the underlying issue and create a
**new** commit — never `--amend`. Run `git status` afterward to confirm.

### Step 6: Ask before pushing
Show the commit subject and branch, then ask:
> **Commit created on branch `<branch>`. What next?**
> 1. Continue, push it
> 2. Leave it local, I'll push manually

- Option 1: `git push` (if the branch has no upstream, `git push -u origin <branch>`),
  then report success.
- Option 2: tell the user it's local and they can push later.

---

## Error handling

| Situation | Action |
|-----------|--------|
| Merge conflicts after pull | Stop, list conflicting files, wait for the user |
| No changes to commit | Stop, inform the user, no empty commit |
| Hook failure on commit | Fix the reported issue, create a new commit (never `--amend`) |
| Push rejected (non-fast-forward) | Report it, suggest `git pull --rebase`, then retry |
