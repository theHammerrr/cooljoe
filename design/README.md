# Design Workspace

This project keeps Stitch design exploration separate from hand-edited app code.

- `design/stitch/`: raw Stitch prompts and exports
- `design/generated/`: generated UI/code artifacts

Current target:
- Query analysis workspace redesign for the SQL studio

Direct Stitch MCP workflow:
- Configure your Stitch API key in `C:\Users\yonib\.gemini\extensions\Stitch\gemini-extension.json`
- Generate a design run with `powershell -ExecutionPolicy Bypass -File scripts/generate-design.ps1`
- Each run is saved under `design/stitch/<timestamp>-<projectId>/`
- Raw outputs include the prompt, JSON response, text summary, suggestions, and screen metadata
- HTML and screenshot downloads are optional and can be enabled with `-DownloadAssets`

Useful options:
- Reuse an existing project: `-ProjectId <id>`
- Override prompt file: `-PromptFile design/stitch/query-analysis-redesign.prompt.md`
- Change device type: `-DeviceType DESKTOP`
- Download the generated HTML and screenshot: `-DownloadAssets`
