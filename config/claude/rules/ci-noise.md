# CI Noise

On a CI failure event, read the job log before reporting. A lost or cancelled agent (spot preemption, `Received cancellation signal`, exit -1) with no failing tests is not news: if Buildkite already retried it, end the turn without a message; if not, retry the job yourself. Only report real test failures, jobs that can't be retried or keep dying, CI going green, reviews, and merge conflicts.
