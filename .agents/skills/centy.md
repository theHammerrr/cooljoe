---
name: centy
description: Skill for interacting with the centy CLI to manage project docs and issues
---

# `centy` CLI Skill

The `centy` CLI is used to manage project issues and docs via code in the `.centy` folder. Use the terminal to interface with these commands when managing issues or documentation.

## General Usage
Run `centy [COMMAND] [ARGS]` inside the workspace root.

## Common Workflows

### Managing Issues
- To close an issue: `centy close [DISPLAY_NUMBER]`
- To view an issue: `centy issue [ID_OR_DISPLAY_NUMBER]`
- To assign users: `centy assign`
- To unassign users: `centy unassign`

### Managing Documentation
- To create a new doc: `centy create`
- To duplicate a doc: `centy duplicate`
- To move a doc: `centy move`

### Assets
- **Add asset**: `centy add`
- **Delete asset**: `centy delete`
- **List assets**: `centy list`
- **Get asset**: `centy get`

### Project Administration
- **Init**: `centy init` (Initializes `.centy` folder)
- **Register**: `centy register` (Registers for tracking)
- **Untrack**: `centy untrack`
- **Config**: `centy config` (View project configuration)
- **Manifest**: `centy manifest`
- **Compact**: `centy compact` (Compact uncompacted issues into feature summaries)

### Daemon Management
- Start daemon: `centy start`
- Restart daemon: `centy restart`
- Shutdown daemon: `centy shutdown`
- Info: `centy info`
- Install: `centy install`
- Configure auto-start: `centy daemon`
