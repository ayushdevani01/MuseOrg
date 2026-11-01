# Employee hiring and integration catalog

Verified 1 November 2026 on the isolated local development stack.

- Hiring asks for an existing role or custom responsibilities, then offers an
  optional skill search. Creation still works when public discovery is unavailable.
- A live browser run searched skills.sh, previewed `web-design-guidelines` from
  `vercel-labs/agent-skills`, selected it and created an employee. Readback through
  the authenticated API matched the reviewed commit and bundle digest, and the
  employee's instructions selected that skill. No model call was needed.
- Deterministic runtime tests loaded imported instructions and a supporting file
  through the normal `skill_read` tool and refused an unlisted resource path.
- Offline tests cover fixed public sources, pinned files and digests, incomplete
  trees, links, traversal, bundle limits, preview consent and conflicting/edited
  local skills. Creation reuses the existing transaction seed mechanism.
- Browser regressions passed for custom hiring with unavailable discovery,
  registered MCP listing, MCP/API setup and official MCP preset logos/forms.
  MCP setup used a synthetic network fixture for its reserved example domains;
  it does not establish authorization or live tools on a third-party account.
- The skill-import browser check used the normal public-directory adapter and
  actual public GitHub content. It is opt-in with `VERIFY_LIVE_SKILLS=1`.
- Type checks, API/worker builds and the web production build passed. Desktop
  shares the web UI; native mobile retains its existing flows for this slice.

Imported skills use the existing owner/space library, with provenance and bounded
supporting text stored in the skill document. They select expertise, not new
tools or account permissions. Large/binary bundles are currently unsupported.
The UI describes actual catalog/registered integrations; adding a preset opens
the existing connection form and does not imply that its account is connected.
