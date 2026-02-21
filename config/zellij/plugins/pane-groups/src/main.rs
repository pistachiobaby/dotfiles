use std::collections::{BTreeMap, HashMap, HashSet};
use zellij_tile::prelude::*;

const MAX_GROUPS: u8 = 9;

#[derive(Default, PartialEq)]
enum Mode {
    #[default]
    Normal,
    Add,
}

#[derive(Default)]
struct State {
    groups: HashMap<u8, Vec<PaneId>>,
    active_group: Option<u8>,
    pane_manifest: Option<PaneManifest>,
    tab_info: Vec<TabInfo>,
    permissions_granted: bool,
    selected: u8,
    mode: Mode,
    last_focused_pane: Option<PaneId>,
    last_focused_tab: Option<usize>,
}

register_plugin!(State);

impl State {
    fn active_tab_position(&self) -> Option<usize> {
        self.tab_info.iter().find(|t| t.active).map(|t| t.position)
    }

    fn focused_terminal_pane(&self) -> Option<PaneId> {
        let manifest = self.pane_manifest.as_ref()?;
        let tab_pos = self.active_tab_position()?;
        let panes = manifest.panes.get(&tab_pos)?;
        for pane in panes {
            if pane.is_focused && !pane.is_plugin {
                return Some(pane_id_from(pane));
            }
        }
        None
    }

    fn update_last_focused(&mut self) {
        if let Some(id) = self.focused_terminal_pane() {
            self.last_focused_pane = Some(id);
            self.last_focused_tab = self.active_tab_position();
        }
    }

    fn validate_groups(&mut self) {
        let manifest = match &self.pane_manifest {
            Some(m) => m,
            None => return,
        };

        let mut all_pane_ids: HashSet<PaneId> = HashSet::new();
        for panes in manifest.panes.values() {
            for pane in panes {
                all_pane_ids.insert(pane_id_from(pane));
            }
        }

        for group in self.groups.values_mut() {
            group.retain(|id| all_pane_ids.contains(id));
        }

        // Clear active_group if it's now empty
        if let Some(ag) = self.active_group {
            if self.groups.get(&ag).map(|g| g.is_empty()).unwrap_or(true) {
                self.active_group = None;
            }
        }
    }

    fn pane_name(&self, pane_id: &PaneId) -> String {
        if let Some(manifest) = &self.pane_manifest {
            for panes in manifest.panes.values() {
                for pane in panes {
                    if pane_id_from(pane) == *pane_id {
                        if !pane.title.is_empty() {
                            return pane.title.clone();
                        }
                        if let Some(cmd) = &pane.terminal_command {
                            return cmd.clone();
                        }
                        return format!("pane {}", pane.id);
                    }
                }
            }
        }
        format!("{:?}", pane_id)
    }

    fn group_containing(&self, pane_id: &PaneId) -> Option<u8> {
        for (&group_num, panes) in &self.groups {
            if panes.contains(pane_id) {
                return Some(group_num);
            }
        }
        None
    }

    fn non_empty_groups(&self) -> Vec<u8> {
        let mut nums: Vec<u8> = self
            .groups
            .iter()
            .filter(|(_, panes)| !panes.is_empty())
            .map(|(&num, _)| num)
            .collect();
        nums.sort();
        nums
    }

    fn add_to_group(&mut self, group_num: u8) {
        if let Some(pane_id) = self.last_focused_pane {
            // Remove from any existing group first
            for group in self.groups.values_mut() {
                group.retain(|id| *id != pane_id);
            }
            self.groups.entry(group_num).or_default().push(pane_id);
        }
    }

    fn remove_focused_from_group(&mut self) {
        if let Some(pane_id) = self.last_focused_pane {
            for group in self.groups.values_mut() {
                group.retain(|id| *id != pane_id);
            }
        }
    }

    /// Activate a group: show its panes, hide all other groups' panes, stack it.
    fn activate_group(&mut self, group_num: u8) {
        let target_panes = match self.groups.get(&group_num) {
            Some(p) if !p.is_empty() => p.clone(),
            _ => return,
        };

        // Hide all panes belonging to OTHER groups
        for (&num, panes) in &self.groups {
            if num == group_num {
                continue;
            }
            for pane_id in panes {
                hide_pane_with_id(*pane_id);
            }
        }

        // Show all panes in the target group
        for pane_id in &target_panes {
            show_pane_with_id(*pane_id, false);
        }

        // Stack them together
        if target_panes.len() > 1 {
            stack_panes(target_panes.clone());
        }

        self.active_group = Some(group_num);

        // Focus the first pane and close the UI
        hide_self();
        focus_pane_with_id(target_panes[0], false);
    }

    /// Cycle to the next non-empty group (wraps around).
    fn cycle_group(&mut self, forward: bool) {
        let groups = self.non_empty_groups();
        if groups.is_empty() {
            return;
        }

        let current = self.active_group.unwrap_or(0);
        let next = if forward {
            groups
                .iter()
                .find(|&&n| n > current)
                .or_else(|| groups.first())
                .copied()
                .unwrap()
        } else {
            groups
                .iter()
                .rev()
                .find(|&&n| n < current)
                .or_else(|| groups.last())
                .copied()
                .unwrap()
        };

        self.activate_group(next);
    }

    /// Show all groups (unhide everything).
    fn show_all(&mut self) {
        for panes in self.groups.values() {
            for pane_id in panes {
                show_pane_with_id(*pane_id, false);
            }
        }
        self.active_group = None;
    }
}

impl ZellijPlugin for State {
    fn load(&mut self, _configuration: BTreeMap<String, String>) {
        request_permission(&[
            PermissionType::ReadApplicationState,
            PermissionType::ChangeApplicationState,
        ]);
        subscribe(&[
            EventType::PaneUpdate,
            EventType::TabUpdate,
            EventType::Key,
            EventType::PermissionRequestResult,
        ]);
        self.selected = 1;
    }

    fn update(&mut self, event: Event) -> bool {
        match event {
            Event::PermissionRequestResult(PermissionStatus::Granted) => {
                self.permissions_granted = true;
                false
            }
            Event::PaneUpdate(manifest) => {
                self.pane_manifest = Some(manifest);
                self.update_last_focused();
                self.validate_groups();
                true
            }
            Event::TabUpdate(tabs) => {
                self.tab_info = tabs;
                self.update_last_focused();
                true
            }
            Event::Key(key) => {
                self.handle_key(key);
                true
            }
            _ => false,
        }
    }

    fn pipe(&mut self, msg: PipeMessage) -> bool {
        if !msg.is_private {
            return false;
        }
        match msg.name.as_str() {
            "toggle_ui" => {
                show_self(false);
                true
            }
            "next_group" => {
                self.cycle_group(true);
                false
            }
            "prev_group" => {
                self.cycle_group(false);
                false
            }
            "activate_group" => {
                if let Some(num) = msg.payload.as_deref().and_then(|s| s.parse::<u8>().ok()) {
                    if num >= 1 && num <= MAX_GROUPS {
                        self.activate_group(num);
                    }
                }
                false
            }
            "show_all" => {
                self.show_all();
                false
            }
            _ => false,
        }
    }

    fn render(&mut self, rows: usize, cols: usize) {
        let mode_label = match self.mode {
            Mode::Normal => "",
            Mode::Add => " [ADD: press 1-9]",
        };

        let last_pane_name = self
            .last_focused_pane
            .as_ref()
            .map(|id| self.pane_name(id))
            .unwrap_or_else(|| "none".to_string());

        let current_group = self
            .last_focused_pane
            .as_ref()
            .and_then(|id| self.group_containing(id));

        // Header
        println!(
            "\x1b[1;37m Pane Groups\x1b[0m\x1b[90m{}\x1b[0m",
            mode_label
        );
        let active_label = self
            .active_group
            .map(|g| format!("  \x1b[90mactive: \x1b[36m{}\x1b[0m", g))
            .unwrap_or_default();
        println!(
            "\x1b[90m Last pane: \x1b[33m{}\x1b[0m{}{}",
            truncate(&last_pane_name, cols.saturating_sub(30)),
            current_group
                .map(|g| format!(" \x1b[90m(group {})\x1b[0m", g))
                .unwrap_or_default(),
            active_label
        );
        println!();

        // Groups
        let available_rows = rows.saturating_sub(6); // header + footer
        let mut lines_used = 0;

        for group_num in 1..=MAX_GROUPS {
            if lines_used >= available_rows {
                break;
            }

            let panes = self.groups.get(&group_num);
            let count = panes.map(|p| p.len()).unwrap_or(0);
            let is_active = self.active_group == Some(group_num);
            let is_folded = self.active_group.is_some() && !is_active && count > 0;
            let is_selected = group_num == self.selected;

            let indicator = if is_selected { ">" } else { " " };

            if count == 0 {
                let dim = if is_selected { "\x1b[1;37m" } else { "\x1b[90m" };
                println!("{}{} {}: empty\x1b[0m", dim, indicator, group_num);
                lines_used += 1;
            } else {
                let status = if is_active {
                    " \x1b[32m[active]\x1b[0m"
                } else if is_folded {
                    " \x1b[90m[folded]\x1b[0m"
                } else {
                    ""
                };
                let highlight = if is_selected { "\x1b[1;36m" } else { "\x1b[37m" };
                println!(
                    "{}{} {}: {} pane{}{}\x1b[0m",
                    highlight,
                    indicator,
                    group_num,
                    count,
                    if count == 1 { "" } else { "s" },
                    status
                );
                lines_used += 1;

                if let Some(panes) = panes {
                    for (i, pane_id) in panes.iter().enumerate() {
                        if lines_used >= available_rows {
                            break;
                        }
                        let name = self.pane_name(pane_id);
                        let connector = if i == panes.len() - 1 { "└" } else { "├" };
                        println!(
                            "\x1b[90m   {} {}\x1b[0m",
                            connector,
                            truncate(&name, cols.saturating_sub(6))
                        );
                        lines_used += 1;
                    }
                }
            }
        }

        // Footer
        let remaining = rows.saturating_sub(3 + lines_used + 2);
        for _ in 0..remaining {
            println!();
        }
        println!();
        println!(
            "\x1b[90m a\x1b[0m add  \x1b[90md\x1b[0m remove  \
             \x1b[90mEnter\x1b[0m activate  \x1b[90mu\x1b[0m unfold all  \
             \x1b[90mq\x1b[0m close"
        );
    }
}

impl State {
    fn handle_key(&mut self, key: KeyWithModifier) {
        if self.mode == Mode::Add {
            if let Some(num) = key_to_group_num(&key) {
                self.add_to_group(num);
                self.mode = Mode::Normal;
            } else {
                // Any other key cancels add mode
                self.mode = Mode::Normal;
            }
            return;
        }

        match &key {
            k if is_key(k, BareKey::Char('q')) || is_key(k, BareKey::Esc) => {
                hide_self();
                if let Some(pane_id) = self.last_focused_pane {
                    focus_pane_with_id(pane_id, false);
                }
            }
            k if is_key(k, BareKey::Char('j')) || is_key(k, BareKey::Down) => {
                if self.selected < MAX_GROUPS {
                    self.selected += 1;
                }
            }
            k if is_key(k, BareKey::Char('k')) || is_key(k, BareKey::Up) => {
                if self.selected > 1 {
                    self.selected -= 1;
                }
            }
            k if is_key(k, BareKey::Enter) => {
                self.activate_group(self.selected);
            }
            k if is_key(k, BareKey::Char('a')) => {
                self.mode = Mode::Add;
            }
            k if is_key(k, BareKey::Char('d')) => {
                self.remove_focused_from_group();
            }
            k if is_key(k, BareKey::Char('u')) => {
                self.show_all();
            }
            k if is_key(k, BareKey::Tab) => {
                self.cycle_group(true);
            }
            k => {
                // Direct group number jump (1-9)
                if let Some(num) = key_to_group_num(k) {
                    self.selected = num;
                }
            }
        }
    }
}

fn pane_id_from(pane: &PaneInfo) -> PaneId {
    if pane.is_plugin {
        PaneId::Plugin(pane.id)
    } else {
        PaneId::Terminal(pane.id)
    }
}

fn key_to_group_num(key: &KeyWithModifier) -> Option<u8> {
    match key.bare_key {
        BareKey::Char(c) if c.is_ascii_digit() && c != '0' => Some(c as u8 - b'0'),
        _ => None,
    }
}

fn is_key(key: &KeyWithModifier, bare: BareKey) -> bool {
    key.bare_key == bare && key.key_modifiers.is_empty()
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else if max > 3 {
        format!("{}...", &s[..max - 3])
    } else {
        s[..max].to_string()
    }
}
