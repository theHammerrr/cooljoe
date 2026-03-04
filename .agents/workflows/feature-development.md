---
description: Feature Development and Centy Issue Tracking
---

# Feature Development Workflow

When working on any feature in this repository, you must integrate your process with the `centy` issue tracker. The `centy` issues are kept locally and act as the single source of truth for task management and context.

## 1. Product Context
*(Agent: Learn about the product from the explanation below before beginning work)*

[PRODUCT EXPLANATION GOES HERE]


## 2. Issue Discovery
If you need more context about the system, learn about the product from the existing `centy` issues. 
You can do this by using the `centy` CLI tools or by directly reading the files from the local file system (inside the `.centy` directory).

## 3. Issue Management Lifecycle
Every new feature or task MUST follow this lifecycle:

1. **Create**: Ensure an issue exists for the feature you are about to develop in `centy`.
2. **Status Tracking**: 
   - Keep the status as `open` or `pending` while the feature is actively being worked on.
3. **Closing**: 
   - Once the feature is successfully implemented and verified, the agent should close the issue (using the `centy close` command) or change its status to `closed`.
