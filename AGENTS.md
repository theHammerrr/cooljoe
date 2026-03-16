## Git Safety
- NEVER use `git commit --no-verify`.
- Do not bypass `pre-commit`, `commit-msg`, `pre-push`, or any other git hooks unless the user explicitly requests hook bypass in the current turn.
- If a git hook fails, stop and report the failing hook output. Fix the issue or ask the user how to proceed.
