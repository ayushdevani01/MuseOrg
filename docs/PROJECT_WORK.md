# Shared projects and trusted delivery

Updated 1 November 2026.

Projects keep a shared goal, structured facts, assigned coworkers and a monotonic
revision. Coworkers read the current brief with `project_read` and register actual
workspace files with `project_output`. The backend reads and hashes their bytes;
the model cannot supply a successful checksum in place of the file.

A correction uses compare-and-swap on the expected revision. One transaction
stores the new brief, marks dependent registrations stale, supersedes undispatched
actions and writes notices for affected coworkers. Existing runs receive steering;
idle coworkers get ordinary queued runs. The existing run reconciler repairs a
missed job publication. Unrelated outputs remain current.

Web and Electron expose this under **Space settings → Projects**. Shared contracts,
run tools and approval cards serve the other clients too. The native mobile client
does not yet have the project-management form; an existing project's corrections
and individual action approvals can use its ordinary chat and approval cards.
Reusable grant management currently uses the web form.

## Authority

`project_revise` always needs the owner's approval of its exact patch.
`project_action` binds the project revision, operation, provider, account, resource,
payload, budget and repository head. General auto-review or allow rules cannot
replace this authority check. An explicit deny rule still applies.

The owner can create an expiring scope for selected coworkers, operations, paths
and a shared total budget. Reservations serialize at dispatch, so concurrent
coworkers cannot each spend the same remaining allowance. Revocation prevents new
dispatches. Uncertain outcomes keep their reservations until a verified receipt
settles them. `project_reconcile` observes an earlier action; it never retries the
write and remains useful after its grant expires or the brief changes.

Output registrations preserve hashes and revisions; working files remain mutable.
Delivery requests freeze the submitted content in the effect journal. A correction
cannot undo an external action that was already dispatched.

## Optional GitHub adapter

Core operation needs no hosted integration vendor. The optional GitHub adapter
uses an operator's authenticated GitHub CLI on the trusted API/worker host. It
never checks out or executes repository code there. GitHub credentials must stay
outside the shared agent computer.

An operator can place `work-connections.json` in the server data directory:

```json
{
  "connections": [{
    "kind": "github-cli",
    "userId": "APP_USER_ID",
    "spaceId": "APP_SPACE_ID",
    "account": "example-account",
    "resource": "example-owner/demo-repository",
    "requiredChecks": ["Repair check"]
  }]
}
```

These are placeholders. The file is operator configuration, outside computer
mounts; it is not a customer-uploaded connection. Restart the services after
changing it. An absent file exposes no host connection. Each binding belongs to
one application user and space; a different CLI account fails closed.

Supported operations are repository reads, content-bound PR creation, exact-head
merge and GitHub Pages deployment readback. Merge requires the configured checks,
all reported checks passing on that head, permitted changed paths and completed
review state. Repository rules remain enforced by GitHub. Reconciliation verifies
the original base and proposed blob hashes before accepting a lost PR receipt.

The adapter accepts zero-cost repository actions. Other provider operations in the
shared vocabulary, including publishing and ads, remain unsupported until an
adapter implements them. Connections advertise their actual operations to the
scope form. Meta accounts and media are a separate integration stage.

Scope enforcement applies to this delivery boundary. Independently connected MCP
servers and authenticated browsers retain their own authority and approval rules.
The shared Team Computer is one OS/browser profile, rather than a hard privacy
boundary between coworkers. A host desktop provider also carries that host user's
OS authority; it is not the isolated Docker configuration used for the demo.
