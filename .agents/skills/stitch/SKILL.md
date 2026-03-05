---
name: Stitch UI
description: Ability to use the Stitch UI extension for Gemini CLI to design, create, and download UI mockups and code.
---

# Stitch UI Integration

This skill enables the agent to use the Stitch platform via the Gemini CLI (`gemini stitch`). Stitch allows users to manage design projects, generate UI mockups from text prompts, and download assets directly from the terminal.

## Prerequisites
1. The **Gemini CLI** must be installed and authenticated.
2. The **Stitch Extension** must be installed via: `gemini extensions install stitch`
3. You must have appropriate workspace credentials.

## Common Capabilities & Commands

The Stitch extension exposes its capabilities natively through the `gemini stitch` command. When a user asks you to interact with Stitch (e.g., retrieving projects, creating UI screens), you should invoke `gemini stitch [command] --help` to discover precise usage.

**Recommended Workflow:**
1. If you are unsure what commands exist, run `gemini stitch --help`.
2. Discover existing projects or workspaces the user might be referring to.
3. To generate a new design, pass the user's prompt into the appropriate generation command provided by the Stitch CLI.
4. When downloading assets, ensure they are placed in the appropriate `apps/web/src/components` or `apps/web/src/assets` directory.

> Note: If the CLI complains about missing authentication (e.g. `GEMINI_API_KEY`), prompt the user to configure their environment.
