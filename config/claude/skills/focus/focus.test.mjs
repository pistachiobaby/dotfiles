// node --test ~/.claude/skills/focus/focus.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReport, linearIdsFromBody, linearRows, renderReport } from "./focus.mjs";

const now = Date.parse("2026-10-20T12:00:00Z");
const hoursAgo = (h) => new Date(now - h * 3_600_000).toISOString();

const pr = (number, extra = {}) => ({
  repo: "gadget-inc/gadget",
  number,
  title: `PR ${number}`,
  url: `https://github.com/gadget-inc/gadget/pull/${number}`,
  draft: false,
  review: "NONE",
  mergeable: "MERGEABLE",
  mergeState: "CLEAN",
  updatedAt: hoursAgo(2),
  createdAt: hoursAgo(30),
  base: "main",
  ci: "green",
  linear: [],
  ...extra,
});

const fixture = () => ({
  now,
  pylon: [
    { number: 2383, title: "Queue dashboard fails", state: "waiting_on_you", latestMessageAt: hoursAgo(5), url: "x" },
    { number: 2343, title: "Routes stall", state: "waiting_on_customer", latestMessageAt: hoursAgo(50), url: "x" },
  ],
  linear: [
    { id: "GGT-1", title: "Spill dedupe to disk", status: "In Progress", updated: hoursAgo(3), pylon: [2383], prs: [] },
    { id: "GGT-2", title: "Old work", status: "In Progress", updated: hoursAgo(5), pylon: [], prs: ["gadget#900"] },
    // Linked only through the Linear attachment: PR 11's body names no issue.
    { id: "GGT-3", title: "Attached only", status: "In Review", updated: hoursAgo(5), pylon: [], prs: ["gadget-inc/gadget#11"] },
  ],
  prs: [
    pr(10, { ci: "red", linear: ["GGT-1"] }),
    pr(11),
    pr(12, { ci: "red", updatedAt: hoursAgo(24 * 10) }),
    pr(13, { draft: true }),
  ],
  sessions: [
    { sessionId: "local_a", title: "Queue dashboard", cwd: "/dev/gadget", prNumber: 10, prState: "OPEN", isRunning: false, lastActivityAt: hoursAgo(1) },
    { sessionId: "local_b", title: "Shipped thing", cwd: "/dev/gadget", prNumber: 800, prState: "MERGED", isRunning: false, lastActivityAt: hoursAgo(40) },
  ],
  repoForCwd: () => "gadget-inc/gadget",
});

test("joins a waiting ticket to its Linear issue, PR and session, and ranks it first", () => {
  const report = buildReport(fixture());
  const markdown = renderReport(report);
  const first = markdown.split("\n").find((l) => l.startsWith("1. "));
  assert.match(first, /^1\. Reply to \[Pylon 2383\]/);
  assert.match(first, /\[GGT-1\]/);
  assert.match(first, /\[gadget#10\]\(.*\) \(CI red\)/);
  assert.match(first, /session \[Queue dashboard\]\(#local_a\)/);
  // The red PR serves a customer ticket, so it is the second item.
  assert.match(markdown.split("\n").find((l) => l.startsWith("2. ")), /^2\. Fix \[gadget#10\].*CI red/);
});

test("puts each PR in one bucket, and a week-idle PR in idle rather than blocked", () => {
  const r = buildReport(fixture());
  const numbers = (list) => list.map((p) => p.number);
  assert.deepEqual(numbers(r.blocked), [10]);
  assert.deepEqual(numbers(r.ready), [11]);
  assert.deepEqual(numbers(r.stalePrs), [12]);
  assert.deepEqual(numbers(r.drafts), [13]);
  assert.deepEqual([...r.prsByKey.get("gadget-inc/gadget#11").issues], ["GGT-3"]);
});

test("flags an issue whose PRs all closed, and a session whose PR merged", () => {
  const r = buildReport(fixture());
  assert.deepEqual(r.prsDone.map((i) => i.id), ["GGT-2"]);
  assert.deepEqual(r.archive.map((s) => s.sessionId), ["local_b"]);
});

test("keeps an issue's Pylon tickets and PRs and drops its other attachments", () => {
  const node = {
    identifier: "GGT-10103",
    title: "Spill dedupe to disk",
    updatedAt: "2026-10-20T22:45:26.147Z",
    state: { name: "In Progress" },
    attachments: {
      nodes: [
        { url: "https://app.usepylon.com/issues?issueNumber=2383" },
        { url: "https://github.com/gadget-inc/gadget/pull/20996" },
        { url: "https://github.com/gadget-inc/gadget/pull/20996" },
        { url: "https://sentry.io/issues/123" },
      ],
    },
  };
  assert.deepEqual(linearRows([node]), [
    { id: "GGT-10103", title: "Spill dedupe to disk", status: "In Progress", updated: "2026-10-20T22:45:26.147Z", pylon: [2383], prs: ["gadget-inc/gadget#20996"] },
  ]);
});

test("takes the PR's own issue from 'Part of' lines over other mentions", () => {
  assert.deepEqual(linearIdsFromBody("Part of GGT-10085\n\nAlternative to GGT-10094."), ["GGT-10085"]);
  assert.deepEqual(linearIdsFromBody("Follow-up to GGT-10071 and GGT-10071"), ["GGT-10071"]);
  assert.deepEqual(linearIdsFromBody("no ids here"), []);
});
