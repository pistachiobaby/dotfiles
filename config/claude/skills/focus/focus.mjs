#!/usr/bin/env node
// /focus: join Pylon tickets, GitHub PRs, Linear issues and Claude sessions into one ranked list.
//
//   direnv exec ~/dev/gadget node focus.mjs collect --dir <dir>   # Pylon, GitHub, Linear -> pylon.json, prs.json, linear.json
//   node focus.mjs report --dir <dir> [--all]                     # adds sessions.json -> report.md
//
// The join keys: a Linear issue's attachments name its Pylon tickets and PRs, a PR body names its
// Linear issue ("Part of GGT-123"), and a session names its PR number (repo comes from its cwd).
import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

// Nicholas in Pylon. The REST key belongs to the org, so /me doesn't return him.
const PYLON_USER_ID = "37493b5d-4084-45a1-b6a2-2c5b07176fd7";
const OPEN_PYLON_STATES = ["new", "waiting_on_you", "fix_in_progress", "on_hold", "waiting_on_customer"];
const STALE_DAYS = 7;
const LIST_LIMIT = 8;
const DAY_MS = 86_400_000;

// ---------- collect ----------

async function pylonSearch(key, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://api.usepylon.com/issues/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < 4) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`Pylon search failed: ${res.status} ${await res.text()}`);
    return await res.json();
  }
}

async function collectPylon(userId) {
  const key = process.env.PYLON_API_KEY;
  if (!key) throw new Error("PYLON_API_KEY is not set: run collect under `direnv exec ~/dev/gadget`");
  // One request chain per state, all at once: 0.8 s instead of 2.0 s one after another.
  const perState = await Promise.all(
    OPEN_PYLON_STATES.map(async (state) => {
      const tickets = [];
      let cursor;
      do {
        const filter = {
          operator: "and",
          subfilters: [
            { field: "state", operator: "equals", value: state },
            { field: "assignee_id", operator: "equals", value: userId },
          ],
        };
        const page = await pylonSearch(key, { limit: 100, cursor, filter });
        for (const i of page.data ?? []) {
          tickets.push({
            number: i.number,
            title: i.title,
            state: i.state,
            latestMessageAt: i.latest_message_time ?? i.created_at,
            url: `https://app.usepylon.com/issues?issueNumber=${i.number}`,
          });
        }
        cursor = page.pagination?.has_next_page ? page.pagination.cursor : undefined;
      } while (cursor);
      return tickets;
    }),
  );
  return perState.flat();
}

const execFileAsync = promisify(execFile);
const MY_OPEN_PRS = "is:pr is:open author:@me org:gadget-inc";

// Asks only for each PR's rolled-up check state. Listing every status context times out: a gadget
// PR carries ~100 Buildkite statuses.
const PR_FIELDS = `number title url isDraft reviewDecision mergeable mergeStateStatus updatedAt createdAt body baseRefName
  repository { nameWithOwner }
  commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }`;

async function searchPrs(search, fields, perPage) {
  const query = `query($endCursor: String) {
    search(query: "${search}", type: ISSUE, first: ${perPage}, after: $endCursor) {
      pageInfo { hasNextPage endCursor }
      nodes { ... on PullRequest { ${fields} } }
    }
  }`;
  const { stdout } = await execFileAsync("gh", ["api", "graphql", "--paginate", "-f", `query=${query}`, "--jq", ".data.search.nodes[]"], {
    maxBuffer: 256 * 1024 * 1024,
  });
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

// Cuts sorted timestamps into `parts` contiguous, inclusive ranges of about equal size.
export function splitRanges(sorted, parts) {
  const size = Math.ceil(sorted.length / parts);
  const ranges = [];
  for (let i = 0; i < sorted.length; i += size) ranges.push([sorted[i], sorted[Math.min(i + size, sorted.length) - 1]]);
  return ranges;
}

// Every started issue (In Progress, In Review) with its attachments in one request: 0.3 s, against
// 93-135 s for a subagent reading them through the Linear connector.
const LINEAR_QUERY = `query($after: String) {
  viewer { assignedIssues(first: 100, after: $after, filter: { state: { type: { eq: "started" } } }) {
    pageInfo { hasNextPage endCursor }
    nodes { identifier title updatedAt state { name } attachments(first: 100) { nodes { url } } }
  } }
}`;

async function collectLinear() {
  const key = process.env.LINEAR_API_KEY;
  if (!key) throw new Error("LINEAR_API_KEY is not set: run collect under `direnv exec ~/dev/gadget`");
  const nodes = [];
  let after;
  do {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({ query: LINEAR_QUERY, variables: { after } }),
    });
    const body = await res.json();
    if (!res.ok || body.errors) throw new Error(`Linear query failed: ${res.status} ${JSON.stringify(body.errors ?? body).slice(0, 500)}`);
    const page = body.data.viewer.assignedIssues;
    nodes.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : undefined;
  } while (after);
  return linearRows(nodes);
}

// Keeps only what the report joins on: each issue's Pylon tickets and PRs.
export function linearRows(nodes) {
  return nodes.map((i) => {
    const urls = i.attachments.nodes.map((a) => a.url);
    const tickets = urls.flatMap((u) => u.match(/usepylon\.com\/.*issueNumber=(\d+)/)?.[1] ?? []);
    const prs = urls.flatMap((u) => {
      const m = u.match(/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/);
      return m ? [`${m[1]}#${m[2]}`] : [];
    });
    return { id: i.identifier, title: i.title, status: i.state.name, updated: i.updatedAt, pylon: [...new Set(tickets.map(Number))], prs: [...new Set(prs)] };
  });
}

const CI_FROM_ROLLUP = { SUCCESS: "green", FAILURE: "red", ERROR: "red", PENDING: "pending", EXPECTED: "pending" };

async function collectPrs() {
  // GitHub's search is slow per page (one search of 114 PRs took 19-25 s, and 100 per page times
  // out), so a cheap pass finds the creation times and four slices fetch the full fields at once (7 s).
  const created = (await searchPrs(MY_OPEN_PRS, "createdAt", 100)).map((p) => p.createdAt).sort();
  const slices = await Promise.all(splitRanges(created, 4).map(([from, to]) => searchPrs(`${MY_OPEN_PRS} created:${from}..${to}`, PR_FIELDS, 25)));
  const byUrl = new Map(slices.flat().map((p) => [p.url, p]));
  return [...byUrl.values()]
    .map((p) => ({
      repo: p.repository.nameWithOwner,
      number: p.number,
      title: p.title,
      url: p.url,
      draft: p.isDraft,
      review: p.reviewDecision || "NONE",
      mergeable: p.mergeable,
      mergeState: p.mergeStateStatus,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      base: p.baseRefName,
      ci: CI_FROM_ROLLUP[p.commits.nodes[0]?.commit.statusCheckRollup?.state] ?? "none",
      linear: linearIdsFromBody(p.body ?? ""),
    }));
}

// "Part of GGT-1" / "Fixes GGT-1" name the PR's own issue; other mentions are only a fallback,
// since descriptions also cite related issues.
export function linearIdsFromBody(body) {
  const explicit = [...body.matchAll(/\b(?:part of|fixes|fixed|closes|resolves|refs?)\s+(GGT-\d+)\b/gi)].map((m) => m[1].toUpperCase());
  const ids = explicit.length ? explicit : [...body.matchAll(/\bGGT-\d+\b/g)].map((m) => m[0]);
  return [...new Set(ids)];
}

// ---------- report ----------

const prKey = (repo, number) => `${repo}#${number}`;
const ageMs = (iso, now) => now - Date.parse(iso);

function ago(iso, now) {
  const hours = ageMs(iso, now) / 3_600_000;
  return hours < 48 ? `${Math.max(1, Math.round(hours))} h` : `${Math.round(hours / 24)} d`;
}

// A PR ref from linear.json: "gadget#20996", or "owner/repo#1" outside gadget-inc.
function prKeyFromRef(ref) {
  const m = String(ref).match(/^(?:([\w.-]+)\/)?([\w.-]+)#(\d+)$/);
  return m ? prKey(`${m[1] ?? "gadget-inc"}/${m[2]}`, Number(m[3])) : null;
}

export function buildReport({ pylon = [], prs = [], sessions = [], linear = [], now = Date.now(), repoForCwd = () => null }) {
  const stale = (iso) => ageMs(iso, now) > STALE_DAYS * DAY_MS;
  const prsByKey = new Map(prs.map((p) => [prKey(p.repo, p.number), { ...p, key: prKey(p.repo, p.number), issues: new Set(p.linear), sessions: [] }]));
  const ticketsByNumber = new Map(pylon.map((t) => [t.number, { ...t, issues: [] }]));

  // linear.json rows are {id, title, status, updated, pylon: [2383], prs: ["gadget-inc/gadget#20996"]}.
  const issues = linear.map((i) => {
    const prKeys = new Set((i.prs ?? []).map(prKeyFromRef).filter(Boolean));
    const issue = { id: i.id, title: i.title, status: i.status, updatedAt: i.updated, tickets: (i.pylon ?? []).map(Number), prKeys };
    for (const key of prKeys) prsByKey.get(key)?.issues.add(i.id);
    for (const n of issue.tickets) ticketsByNumber.get(n)?.issues.push(i.id);
    return issue;
  });
  const issuesById = new Map(issues.map((i) => [i.id, i]));
  for (const pr of prsByKey.values()) for (const id of pr.issues) issuesById.get(id)?.prKeys.add(pr.key);

  const liveSessions = sessions.filter((s) => !s.isArchived);
  for (const s of liveSessions) {
    if (!s.prNumber) continue;
    const repo = repoForCwd(s.cwd);
    if (repo) prsByKey.get(prKey(repo, s.prNumber))?.sessions.push(s);
  }

  const ticketsFor = (pr) => [...pr.issues].flatMap((id) => issuesById.get(id)?.tickets ?? []);
  const byCustomerThen = (cmp) => (a, b) => (ticketsFor(b).length > 0) - (ticketsFor(a).length > 0) || cmp(a, b);

  const open = [...prsByKey.values()];
  const stalePrs = open.filter((p) => stale(p.updatedAt)).sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
  const active = open.filter((p) => !stale(p.updatedAt));
  const drafts = active.filter((p) => p.draft);
  const blockReasons = (p) => [
    p.ci === "red" && "CI red",
    p.review === "CHANGES_REQUESTED" && "changes requested",
    p.mergeable === "CONFLICTING" && "conflicts",
  ].filter(Boolean);
  const blocked = active.filter((p) => !p.draft && blockReasons(p).length).sort(byCustomerThen((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
  const ready = active
    .filter((p) => !p.draft && !blockReasons(p).length && p.ci === "green" && ["CLEAN", "HAS_HOOKS"].includes(p.mergeState))
    .sort(byCustomerThen((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)));
  const waiting = active.filter((p) => !p.draft && !blocked.includes(p) && !ready.includes(p));

  const tickets = [...ticketsByNumber.values()];
  const customersWaiting = tickets.filter((t) => ["waiting_on_you", "new"].includes(t.state)).sort((a, b) => Date.parse(a.latestMessageAt) - Date.parse(b.latestMessageAt));
  const fixWithoutIssue = tickets.filter((t) => t.state === "fix_in_progress" && !t.issues.length);

  const prsDone = issues.filter((i) => i.prKeys.size && ![...i.prKeys].some((k) => prsByKey.has(k)));
  const staleIssues = issues.filter((i) => !i.prKeys.size && stale(i.updatedAt));
  const archive = liveSessions.filter((s) => !s.isRunning && ["MERGED", "CLOSED"].includes(s.prState)).sort((a, b) => Date.parse(a.lastActivityAt) - Date.parse(b.lastActivityAt));
  const idleSessions = liveSessions.filter((s) => !s.isRunning && !s.prNumber && stale(s.lastActivityAt));

  return { now, prsByKey, issuesById, ticketsByNumber, customersWaiting, fixWithoutIssue, blocked, ready, waiting, drafts, stalePrs, prsDone, staleIssues, archive, idleSessions, issues, blockReasons, ticketsFor };
}

// ---------- render ----------

const repoName = (repo) => repo.split("/")[1];
const quote = (s) => `"${s.length > 80 ? `${s.slice(0, 77)}...` : s}"`;
const stateLabel = (s) => s.replaceAll("_", " ");

function renderReport(r, { all = false } = {}) {
  const now = r.now;
  const prLink = (p) => `[${repoName(p.repo)}#${p.number}](${p.url})`;
  const issueLink = (id) => `[${id}](https://linear.app/gadget-dev/issue/${id})`;
  const ticketLink = (n) => `[Pylon ${n}](https://app.usepylon.com/issues?issueNumber=${n})`;
  const sessionLink = (s) => `[${s.title}](#${s.sessionId})${s.isRunning ? " (running)" : ""}`;
  const prState = (p) => {
    const bits = [p.draft ? "draft" : `CI ${p.ci}`];
    const reasons = r.blockReasons(p).filter((x) => x !== "CI red");
    if (reasons.length) bits.push(...reasons);
    else if (p.review === "APPROVED") bits.push("approved");
    else if (p.review === "REVIEW_REQUIRED") bits.push("review required");
    return bits.join(", ");
  };
  const prContext = (p) => {
    const parts = [...p.issues].map((id) => {
      const t = r.issuesById.get(id)?.tickets ?? [];
      return t.length ? `${issueLink(id)} (${t.map(ticketLink).join(", ")})` : issueLink(id);
    });
    if (p.sessions.length) parts.push(`session ${p.sessions.map(sessionLink).join(", ")}`);
    return parts.length ? ` · ${parts.join(" · ")}` : "";
  };
  const ticketContext = (t) => {
    const parts = t.issues.map((id) => {
      const issue = r.issuesById.get(id);
      const openPrs = [...(issue?.prKeys ?? [])].map((k) => r.prsByKey.get(k)).filter(Boolean);
      const prBits = openPrs.map((p) => `${prLink(p)} (${prState(p)})`);
      const sessions = openPrs.flatMap((p) => p.sessions).map(sessionLink);
      return [issueLink(id), ...prBits, ...sessions.map((s) => `session ${s}`)].join(" · ");
    });
    return parts.length ? ` · ${parts.join(" · ")}` : " · no open Linear issue";
  };

  const lines = {
    customer: (t) => `Reply to ${ticketLink(t.number)} ${quote(t.title)}: waiting on you, last message ${ago(t.latestMessageAt, now)} ago${ticketContext(t)}`,
    blocked: (p) => `Fix ${prLink(p)} ${quote(p.title)}: ${r.blockReasons(p).join(", ")}${prContext(p)}`,
    ready: (p) => `Merge ${prLink(p)} ${quote(p.title)}: CI green, mergeable${p.review === "APPROVED" ? ", approved" : ""}${p.base && !["main", "master"].includes(p.base) ? `, stacked on \`${p.base}\`` : ""}${prContext(p)}`,
    prsDone: (i) => `Close out ${issueLink(i.id)} ${quote(i.title)}: ${i.status}, no open PRs left (${i.prKeys.size} attached)${i.tickets.length ? ` · ${i.tickets.map(ticketLink).join(", ")}` : ""}`,
  };

  const next = [
    ...r.customersWaiting.map(lines.customer),
    ...r.blocked.map(lines.blocked),
    ...r.ready.map(lines.ready),
    ...r.prsDone.map(lines.prsDone),
  ].slice(0, 5);
  if (next.length < 5 && r.archive.length) next.push(`Archive ${r.archive.length} sessions whose PR merged or closed (listed under Cleanup)`);

  const section = (title, items, render) => {
    if (!items.length) return [];
    const shown = all ? items : items.slice(0, LIST_LIMIT);
    const out = [`## ${title} (${items.length})`, "", ...shown.map((x) => `- ${render(x)}`)];
    if (shown.length < items.length) out.push(`- ...and ${items.length - shown.length} more (run with --all)`);
    return [...out, ""];
  };

  const counts = [
    `${r.customersWaiting.length} customers waiting on you`,
    `${r.blocked.length} PRs blocked on you`,
    `${r.ready.length} ready to merge`,
    `${r.waiting.length} waiting on CI or review`,
    `${r.stalePrs.length} PRs idle ${STALE_DAYS}+ days`,
    `${r.archive.length} sessions to archive`,
  ].join(" · ");

  const workstreams = r.issues
    .slice()
    .sort((a, b) => (b.tickets.length > 0) - (a.tickets.length > 0) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .map((i) => {
      const openPrs = [...i.prKeys].map((k) => r.prsByKey.get(k)).filter(Boolean);
      const tickets = i.tickets.map((n) => `${ticketLink(n)}${r.ticketsByNumber.get(n) ? ` (${stateLabel(r.ticketsByNumber.get(n).state)})` : ""}`);
      const sessions = new Set(openPrs.flatMap((p) => p.sessions.map((s) => s.sessionId)));
      return `| ${issueLink(i.id)} ${i.title.length > 60 ? `${i.title.slice(0, 57)}...` : i.title} | ${i.status} | ${tickets.join(", ") || "-"} | ${openPrs.map((p) => `${prLink(p)} ${prState(p)}`).join("<br>") || "-"} | ${sessions.size || "-"} |`;
    });

  return [
    `# Focus, ${new Date(now).toISOString().slice(0, 16).replace("T", " ")} UTC`,
    "",
    counts,
    "",
    "## Next five",
    "",
    ...(next.length ? next.map((l, i) => `${i + 1}. ${l}`) : ["Nothing is waiting on you."]),
    "",
    ...section("Customers waiting on you", r.customersWaiting, lines.customer),
    ...section("PRs blocked on you", r.blocked, lines.blocked),
    ...section("Ready to merge", r.ready, lines.ready),
    ...section("Linear issues with every PR merged or closed", r.prsDone, lines.prsDone),
    ...section("Fix-in-progress tickets with no open Linear issue", r.fixWithoutIssue, (t) => `${ticketLink(t.number)} ${quote(t.title)}, last message ${ago(t.latestMessageAt, now)} ago`),
    ...section("Waiting on CI or review", r.waiting, (p) => `${prLink(p)} ${quote(p.title)}: ${prState(p)}, ${String(p.mergeState).toLowerCase()}${prContext(p)}`),
    ...section("Drafts", r.drafts, (p) => `${prLink(p)} ${quote(p.title)}${prContext(p)}`),
    ...section(`PRs idle ${STALE_DAYS}+ days: close or revive`, r.stalePrs, (p) => `${prLink(p)} ${quote(p.title)}: last update ${ago(p.updatedAt, now)} ago, ${prState(p)}${prContext(p)}`),
    ...section(`Linear issues with no PRs, idle ${STALE_DAYS}+ days`, r.staleIssues, (i) => `${issueLink(i.id)} ${quote(i.title)}: ${i.status}, updated ${ago(i.updatedAt, now)} ago`),
    ...section("Cleanup: sessions whose PR merged or closed", r.archive, (s) => `${sessionLink(s)}: PR #${s.prNumber} ${s.prState.toLowerCase()}, last active ${ago(s.lastActivityAt, now)} ago`),
    ...section(`Sessions with no PR, idle ${STALE_DAYS}+ days`, r.idleSessions, (s) => `${sessionLink(s)}: last active ${ago(s.lastActivityAt, now)} ago`),
    ...(workstreams.length
      ? ["## Workstreams (your started Linear issues)", "", "| Issue | Status | Pylon | Open PRs | Sessions |", "|---|---|---|---|---|", ...workstreams, ""]
      : []),
  ].join("\n");
}

// ---------- cli ----------

function makeRepoResolver() {
  const cache = new Map();
  const originOf = (dir) => {
    try {
      const url = execFileSync("git", ["-C", dir, "remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      return url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1] ?? null;
    } catch {
      return null;
    }
  };
  return (cwd) => {
    if (!cwd) return null;
    if (!cache.has(cwd)) {
      // Worktrees can be deleted after a session ends; fall back to the checkout that held them.
      const checkout = cwd.split("/.claude/worktrees/")[0];
      cache.set(cwd, originOf(cwd) ?? originOf(checkout));
    }
    return cache.get(cwd);
  };
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    console.error(`warning: ${file} is missing; the report will leave that source out`);
    return fallback;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(data) ? data : (data.issues ?? data.sessions ?? fallback);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flag = (name) => {
    const i = rest.indexOf(`--${name}`);
    return i === -1 ? undefined : (rest[i + 1] ?? true);
  };
  const dir = flag("dir");
  if (!dir || !["collect", "report"].includes(cmd)) {
    console.error("usage: focus.mjs collect --dir <dir> | report --dir <dir> [--all]");
    process.exit(2);
  }
  fs.mkdirSync(dir, { recursive: true });

  if (cmd === "collect") {
    const [pylon, prs, linear] = await Promise.all([collectPylon(flag("pylon-user") ?? PYLON_USER_ID), collectPrs(), collectLinear()]);
    fs.writeFileSync(path.join(dir, "pylon.json"), JSON.stringify(pylon, null, 2));
    fs.writeFileSync(path.join(dir, "prs.json"), JSON.stringify(prs, null, 2));
    fs.writeFileSync(path.join(dir, "linear.json"), JSON.stringify(linear, null, 2));
    console.log(`collected ${pylon.length} open Pylon tickets, ${prs.length} open PRs and ${linear.length} started Linear issues into ${dir}`);
    return;
  }

  const report = buildReport({
    pylon: readJson(path.join(dir, "pylon.json"), []),
    prs: readJson(path.join(dir, "prs.json"), []),
    sessions: readJson(path.join(dir, "sessions.json"), []),
    linear: readJson(path.join(dir, "linear.json"), []),
    repoForCwd: makeRepoResolver(),
  });
  const markdown = renderReport(report, { all: rest.includes("--all") });
  fs.writeFileSync(path.join(dir, "report.md"), markdown);
  console.log(markdown);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

export { renderReport };
