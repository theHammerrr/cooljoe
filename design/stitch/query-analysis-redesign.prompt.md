# Query Analysis Workspace Redesign

Redesign a desktop-first SQL query analysis workspace for developers.

Product context:
- This is a self-hosted SQL studio / DB copilot for developers.
- The screen analyzes a SQL query using deterministic checks plus optional AI optimization advice.
- This is not a marketing page and should feel like a serious engineering tool.

Primary goals:
- Make the hierarchy clearer between evidence-based findings and optional AI advice.
- Make it easier to understand what is slow and why.
- Keep dense information readable without feeling cluttered.
- Improve navigation between findings, plan nodes, SQL fragments, and supporting metadata.

Core content the screen should include:
- Deterministic findings list with clear priority and reasonableness badges.
- Selectable Postgres execution plan tree.
- Selected plan node details shown side-by-side with the tree.
- Exact SQL fragment references tied to findings and plan nodes.
- Existing indexes and table stats context.
- Optional AI optimization summary block with a very explicit hallucination warning.
- “Why the model said this” expandable section that shows the structured inputs behind the AI summary.

Behavioral requirements:
- Findings should feel primary.
- AI optimization summary should feel secondary and advisory.
- A finding should be able to focus the relevant plan node.
- The plan tree should stay visible while inspecting a selected node.
- The UI should support large / deep plans without collapsing into noise.

Visual direction:
- Dark SQL-studio aesthetic.
- Dense but readable.
- Strong hierarchy and contrast.
- Crisp panels, restrained color, serious engineering feel.
- Avoid generic dashboard slop and avoid a consumer SaaS landing-page vibe.

Suggested layout direction:
- Top toolbar with SQL/Prisma tabs, analysis mode toggle, AI-summary toggle, and analyze/run actions.
- Main content split into:
  - left main column for findings, AI block, and normalized SQL
  - right inspector column for plan tree, selected node details, indexes, and table stats
- Consider a stronger visual relationship between:
  - finding severity
  - reasonableness explanation
  - focused plan node

Specific emphasis:
- Make scan / join / sort diagnosis very easy to scan.
- Make plan-node selection and context switching feel deliberate.
- Make the hallucination warning impossible to miss without overwhelming the rest of the interface.

Deliverable preference:
- One strong desktop screen concept for the query analysis experience.
- If useful, include a second variant with a more inspector-heavy layout.
