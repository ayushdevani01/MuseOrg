# Default MCP access and live employee regression

Connected MCP servers now reach all of their owner's employees in the same
workspace by default. Server creation applies employee exclusions atomically.
New employees inherit approved servers in their creation transaction. Existing
per-tool restrictions remain intact, and edits or OAuth reconnection do not
re-add an excluded employee. Duplicating an employee preserves its restrictions.
Imported server definitions still require approval before default sharing.

The live API rehearsal verified existing employees, an excluded employee, an
employee hired later, exclusion preservation after an edit, duplication and
rollback when an exclusion named an employee outside the owner scope. PostgreSQL
coverage also checks pending imports, other owners and another workspace owned
by the same user. The web form starts with every employee selected and saves
only explicit exclusions. A CI browser case captures that screen.

A fresh employee inherited the official Ads MCP without a manual assignment.
Given a normal campaign brief without tool names or API parameters, it discovered
the tools, selected the demo account, verified existing artwork and created one
separate paused rehearsal campaign without budget fields. The initial readback
omitted status fields; reviewer feedback identified that specific gap. The same
employee then discovered field metadata, read configured and effective status
as paused and corrected its shared evidence. This was supervised completion,
not a claim of flawless first-pass autonomy.

Further live Meta runs verified durable reporting preferences, a later report,
an independent coworker handoff and review, a one-time background task, and an
authenticated webhook with duplicate delivery suppressed. The corrected Stop
fixture cancelled a running sandbox command and prevented its delayed output.
The initial observer used the wrong relative directory and is not counted as
cancellation evidence. These checks assert structured artifacts and actual
effects; they do not grade free-form language quality.

The local worker and API use the updated build. Account credentials, private
bindings and raw receipts remain outside tracked source. No ad was activated,
no payment method was added, and full social publishing remains separate from
this campaign-and-artwork rehearsal.
