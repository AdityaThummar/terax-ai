use serde::Serialize;

const ESC: u8 = 0x1b;
const BEL: u8 = 0x07;
const OSC_INTRO: u8 = b']';
const ST_FINAL: u8 = b'\\';
const OSC_MAX: usize = 2048;

/// Prefix for Terax agent hook markers in OSC 777. Notifications must NOT match
/// this prefix (those are agent lifecycle signals, not desktop notifications).
const TERAX_MARKER: &[u8] = b"notify;Terax;";

/// Subcommand that identifies a notification in OSC 777.
const NOTIFY_SUBCMD: &[u8] = b"notify;";

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum State {
    Ground,
    Esc,
    Osc,
    OscEsc,
}

#[derive(Clone, PartialEq, Eq, Debug, Serialize)]
pub struct Notification {
    pub title: String,
    pub body: String,
}

pub struct NotificationDetector {
    state: State,
    osc: Vec<u8>,
}

impl NotificationDetector {
    pub fn new() -> Self {
        Self {
            state: State::Ground,
            osc: Vec::with_capacity(256),
        }
    }

    pub fn process<F: FnMut(Notification)>(&mut self, input: &[u8], mut emit: F) {
        if self.state == State::Ground && !input.contains(&ESC) {
            return;
        }

        for &b in input {
            match self.state {
                State::Ground => {
                    if b == ESC {
                        self.state = State::Esc;
                    }
                }
                State::Esc => match b {
                    OSC_INTRO => {
                        self.state = State::Osc;
                        self.osc.clear();
                    }
                    ESC => {}
                    _ => self.state = State::Ground,
                },
                State::Osc => match b {
                    BEL => {
                        self.finish_osc(&mut emit);
                        self.state = State::Ground;
                    }
                    ESC => self.state = State::OscEsc,
                    _ => {
                        if self.osc.len() < OSC_MAX {
                            self.osc.push(b);
                        } else {
                            self.osc.clear();
                            self.state = State::Ground;
                        }
                    }
                },
                State::OscEsc => match b {
                    ST_FINAL => {
                        self.finish_osc(&mut emit);
                        self.state = State::Ground;
                    }
                    ESC => {}
                    _ => {
                        self.osc.clear();
                        self.state = State::Ground;
                    }
                },
            }
        }
    }

    fn finish_osc<F: FnMut(Notification)>(&mut self, emit: &mut F) {
        let body = std::mem::take(&mut self.osc);
        let (ps, pt) = match body.iter().position(|&c| c == b';') {
            Some(i) => (&body[..i], &body[i + 1..]),
            None => (&body[..], &body[0..0]),
        };
        match ps {
            // OSC 9: body-only notification (iTerm2 style).
            // Skip OSC 9;4 (taskbar progress).
            b"9" if !pt.starts_with(b"4;") && pt != b"4" => {
                if let Ok(body) = std::str::from_utf8(pt) {
                    let body = body.trim().to_string();
                    if !body.is_empty() {
                        emit(Notification {
                            title: "Terax".to_string(),
                            body,
                        });
                    }
                }
            }
            // OSC 777: "notify;title;body" (Ghostty/WezTerm style).
            // Must NOT be a Terax agent hook marker.
            b"777"
                if pt.starts_with(NOTIFY_SUBCMD) && !pt.starts_with(TERAX_MARKER) =>
            {
                let payload = &pt[NOTIFY_SUBCMD.len()..];
                let (title, body) = match payload.iter().position(|&c| c == b';') {
                    Some(i) => (
                        String::from_utf8_lossy(&payload[..i]).to_string(),
                        String::from_utf8_lossy(&payload[i + 1..]).to_string(),
                    ),
                    None => (
                        String::from_utf8_lossy(payload).to_string(),
                        String::new(),
                    ),
                };
                let title = title.trim().to_string();
                let body = body.trim().to_string();
                if !title.is_empty() || !body.is_empty() {
                    emit(Notification {
                        title: if title.is_empty() { "Terax".to_string() } else { title },
                        body,
                    });
                }
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn collect_notifications(input: &[u8]) -> Vec<Notification> {
        let mut det = NotificationDetector::new();
        let mut notifs = Vec::new();
        det.process(input, |n| notifs.push(n));
        notifs
    }

    #[test]
    fn osc9_simple_notification() {
        let notifs = collect_notifications(b"\x1b]9;Build finished\x07");
        assert_eq!(notifs.len(), 1);
        assert_eq!(notifs[0].title, "Terax");
        assert_eq!(notifs[0].body, "Build finished");
    }

    #[test]
    fn osc9_st_terminator() {
        let notifs = collect_notifications(b"\x1b]9;Hello\x1b\\");
        assert_eq!(notifs.len(), 1);
        assert_eq!(notifs[0].body, "Hello");
    }

    #[test]
    fn osc9_skips_progress() {
        let notifs = collect_notifications(b"\x1b]9;4;1;50\x07");
        assert!(notifs.is_empty());
    }

    #[test]
    fn osc777_notify_title_body() {
        let notifs = collect_notifications(b"\x1b]777;notify;Deploy;Production is live\x07");
        assert_eq!(notifs.len(), 1);
        assert_eq!(notifs[0].title, "Deploy");
        assert_eq!(notifs[0].body, "Production is live");
    }

    #[test]
    fn osc777_skips_terax_agent_marker() {
        let notifs = collect_notifications(b"\x1b]777;notify;Terax;attention\x07");
        assert!(notifs.is_empty());
    }

    #[test]
    fn osc777_non_notify_subcommand_ignored() {
        let notifs = collect_notifications(b"\x1b]777;other;data\x07");
        assert!(notifs.is_empty());
    }

    #[test]
    fn osc777_title_only() {
        let notifs = collect_notifications(b"\x1b]777;notify;Task done\x07");
        assert_eq!(notifs.len(), 1);
        assert_eq!(notifs[0].title, "Task done");
        assert_eq!(notifs[0].body, "");
    }

    #[test]
    fn empty_body_ignored() {
        let notifs = collect_notifications(b"\x1b]9;\x07");
        assert!(notifs.is_empty());
    }

    #[test]
    fn incremental_parsing() {
        let mut det = NotificationDetector::new();
        let mut notifs = Vec::new();
        det.process(b"\x1b]9;Hel", |n| notifs.push(n));
        assert!(notifs.is_empty());
        det.process(b"lo\x07", |n| notifs.push(n));
        assert_eq!(notifs.len(), 1);
        assert_eq!(notifs[0].body, "Hello");
    }
}
