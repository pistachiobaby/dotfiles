# Linear: Check Lifeboat Before Code Changes

Before the first code change in a gadget-inc repository (an edit, a commit, a new branch), check Linear for a ticket that already covers the work, so two people don't build the same thing.

1. Search the **Lifeboat** project (`P-GGT-103`, team RND) with `mcp__linear__list_issues`, passing `project: "P-GGT-103"` and a `query`. Run two or three queries with different words for the work (the subsystem, the symptom, the feature), because titles rarely use the words you'd guess. Look at open tickets and at anything completed in the last two weeks.
2. **A match assigned to someone else, or already In Progress:** stop before changing code. Tell me the ticket, its assignee and status, and ask how to go on.
3. **A match that's mine or unassigned:** use it. Assign it to me and move it to In Progress.
4. **No match:** create one without asking. Use team RND, `project: "P-GGT-103"` (pass the ID, not the name), assignee me, state In Progress. Give it a title that says what the change does, and two or three sentences on why, with the evidence (numbers, environment ids, Pylon or PR links).
5. Put the ticket's identifier (e.g. `GGT-1234`) in the PR description so Linear links the PR, and name the ticket when reporting back.

Read-only work (investigations, queries, answering questions) doesn't need a ticket. If the Linear tools aren't available, say so and carry on.

**Why:** on 19 Oct 2026 I asked for this "to make sure we're not stepping on anyone else's toes".
