# MCP tool acceptance — 30 October 2026

Result: passed one bounded live Chief task using `openai-codex` / `gpt-6-luna`
and a protocol-complete, loopback-only Streamable HTTP MCP server built with the
installed MCP SDK.

- The ordinary authenticated API registered the server and stored its synthetic
  bearer credential through the encrypted secret store. The returned server
  description did not contain that credential.
- The normal connection test completed the MCP initialization and tool discovery
  handshake, reporting one healthy tool.
- The ordinary assignment API gave Chief an explicit one-tool allowlist with
  unrestricted access disabled. Existing unrelated assignments were preserved.
- One user task completed through the worker. The fixture's independently
  persisted receipt recorded exactly one authenticated `read_test_marker` call
  and the exact synthetic marker returned by that tool. The verification helper
  never invoked the tool itself.
- The task recorded two model turns, covering the tool call and final response.
  Recorded monetary costs were catalog estimates, not verified subscription
  charges or remaining allowance.
- Cleanup removed only the acceptance server and its assignment. Independent API
  reads confirmed their removal and preservation of unrelated assignments. The
  local fixture was stopped.

The private-endpoint permission was enabled only in the isolated acceptance
process, using the existing generic setting. The ignored launcher override was
removed after the test; normal deployment settings were unchanged.

This verifies the model-to-MCP path through discovery, encrypted credentials,
assignment, worker execution and an independently observed tool result. It does
not verify external service OAuth, a particular third-party account, stdio MCP,
publishing, merging, or the complete MuseOrg demonstrations.
