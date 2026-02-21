#!/bin/bash
# Send Ctrl+C to all panes in the current Zellij session

# Count panes by parsing dump-layout output
# Each "pane " entry (with space) represents a pane in the layout
NUM_PANES=$(zellij action dump-layout 2>/dev/null | grep -c "pane ")

if [[ -z "$NUM_PANES" || "$NUM_PANES" -eq 0 ]]; then
  echo "Could not detect panes or not in a Zellij session"
  exit 1
fi

echo "Stopping $NUM_PANES panes..."

for ((i=1; i<=NUM_PANES; i++)); do
  zellij action write 3  # Ctrl+C is ASCII 3
  zellij action focus-next-pane
  sleep 0.1  # Small delay to ensure the signal is processed
done

echo "Sent Ctrl+C to all $NUM_PANES panes"
