#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

cargo build --target wasm32-wasip1 --release

WASM="target/wasm32-wasip1/release/pane-groups.wasm"
DEST="$HOME/.config/zellij/plugins/pane-groups.wasm"

mkdir -p "$(dirname "$DEST")"
cp "$WASM" "$DEST"

echo "Installed $DEST ($(du -h "$DEST" | cut -f1))"
