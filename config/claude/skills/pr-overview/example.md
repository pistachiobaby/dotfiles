<!-- The body of gadget-inc/global-infrastructure#1929 as shipped on 7 Oct 2026 (528 words, not counting this comment). Title: "Prefer zones with capacity for Buildkite agent VMs (BALANCED target shape)". One known miss: the trace times are UTC and the shipped body does not say so; this copy adds it. Everything below this comment is the PR body. -->

New Buildkite agent groups will prefer zones that have capacity when they place a VM. Merging this changes nothing that exists today: Terraform Cloud's plan for the PR is `no changes` ([run](https://app.terraform.io/app/gadget/ci/runs/run-ytCfVaCFxaPGyUCF)). The two groups that were stuck were already patched live on 7 Oct.

## The problem

Over the past week builds sat in `scheduled` for 3 to 20 hours because no agent VM existed to run `Pipeline upload`. gadget build 66587 waited 20 h 38 min.

Agent VMs come from MIGs (managed instance groups, the GCP objects that create VMs from a template). Our autoscaler tells a MIG how many VMs it wants, and the MIG picks a zone for each one. The rule it picks by is the target distribution shape. We never set it, so we got the default, `EVEN`, which picks by count alone and keeps retrying a zone that has no room.

`us-central1-f` had no on-demand `t2d` capacity. On-demand agent VM creates over the 72 hours before the fix:

| Zone | Created | Failed |
|---|---|---|
| `us-central1-f` | 2 | 89 |
| `us-central1-c` | 10 | 11 |
| `us-central1-b` | 8 | 0 |

`BALANCED` prefers zones where resources are available. Since the two stuck groups were patched, all 3 single-VM requests have landed in zones c, c and b.

## Why `ignore_changes`

The one line on its own would have been dangerous here. This stack pins the `google-beta` provider at 4.66.0, which marks the field `ForceNew` ([source](https://github.com/hashicorp/terraform-provider-google-beta/blob/v4.66.0/google-beta/resource_compute_region_instance_group_manager.go#L236-L242)), meaning a change to it destroys and recreates the group. 52 of the 54 groups are still `EVEN`, so terraform would have planned 52 replacements. In-place updates only work from 6.9.0.

With `ignore_changes`, terraform uses the value when it creates a group and leaves existing groups alone. An existing group is changed with one API call (`regionInstanceGroupManagers.patch`) that doesn't touch running VMs.

## What this doesn't fix

`BALANCED` is half of the fix. A VM gets its zone once, and a failed create is retried in that same zone under either shape. Until it succeeds it is a placeholder: the group counts it, but there is no VM.

8 minutes after the multiuse group was unblocked, it stalled again (times are UTC):

```
14:23:08  autoscaler asks for 5 VMs   2 go to zone c, 1 to b, 2 to f
                                      the 2 in f fail and stay in f
14:28:29  group shrinks to target 2   both are the zone f placeholders, 0 real VMs
```

The autoscaler counts a placeholder as an agent, and its scale-down only removes running VMs, so the placeholders are what is left. I removed them by hand both times (5 in total, none with a VM behind it). The first time, the waiting jobs started about 70 seconds later. #1930 makes the autoscaler do that itself.

## Not verified

- A plan of the one-line version without `ignore_changes`. The 52 replacements figure comes from the provider source, not an observed plan.
- That a group terraform creates with this config comes up `BALANCED`. No new group was created.

Next: #1930 for the autoscaler, then the same live patch for the other 52 groups.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
