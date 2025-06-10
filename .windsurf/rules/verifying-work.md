---
trigger: always_on
---

For each task, we will follow a "before, during, and after" workflow:

1.  **Before:** Confirm the current state and assumptions using MCP tools (e.g., `list_dir`, `view_line_range`, `grep_search`), for example verifying that a bug can be reproduced in the browser before beginning work on fixing it.
2.  **During:** Make the necessary code changes using appropriate tools, continuing the work with high agency and resourcefulness until it is done or reaching a dead end.
3.  **After:** Verify the behavior and ensure it matches the changes, again using MCP tools (e.g., running tests, checking logs, `browser_preview`).