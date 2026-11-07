use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

const LABEL: &str = "hud";
const WIDTH: f64 = 340.0;
const HEIGHT: f64 = 56.0;
const MARGIN_RIGHT: f64 = 20.0;
const MARGIN_TOP: f64 = 44.0;
const VISIBLE_FOR: Duration = Duration::from_millis(1600);

// Each request bumps this; a timer only hides the window if nothing newer arrived meanwhile.
static GENERATION: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, thiserror::Error)]
pub enum HudError {
    #[error("could not show the confirmation: {0}")]
    Tauri(#[from] tauri::Error),
}

impl serde::Serialize for HudError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

/// Top right corner of a monitor, in physical pixels.
pub fn corner(origin: (i32, i32), size: (u32, u32), scale: f64) -> (i32, i32) {
    let x = origin.0 as f64 + size.0 as f64 - (WIDTH + MARGIN_RIGHT) * scale;
    let y = origin.1 as f64 + MARGIN_TOP * scale;
    (x.round() as i32, y.round() as i32)
}

fn place(app: &AppHandle, window: &WebviewWindow) -> tauri::Result<()> {
    if let Some(monitor) = app.primary_monitor()? {
        let origin = monitor.position();
        let size = monitor.size();
        let (x, y) = corner(
            (origin.x, origin.y),
            (size.width, size.height),
            monitor.scale_factor(),
        );
        window.set_position(PhysicalPosition::new(x, y))?;
    }
    Ok(())
}

fn create(app: &AppHandle, message: &str) -> tauri::Result<WebviewWindow> {
    let query: String = url_encode(message);
    let window = WebviewWindowBuilder::new(
        app,
        LABEL,
        WebviewUrl::App(format!("index.html?hud=1&m={query}").into()),
    )
    .title("CleanCopy")
    .inner_size(WIDTH, HEIGHT)
    .decorations(false)
    .transparent(true)
    .shadow(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .focused(false)
    .visible(false)
    .build()?;
    // The confirmation must never catch a click meant for the app underneath.
    window.set_ignore_cursor_events(true)?;
    Ok(window)
}

fn url_encode(text: &str) -> String {
    text.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                (b as char).to_string()
            }
            _ => format!("%{b:02X}"),
        })
        .collect()
}

// Async so the window is built off the main thread; creating one from a sync command can deadlock on Windows.
#[tauri::command]
pub async fn show_hud(app: AppHandle, message: String) -> Result<(), HudError> {
    let generation = GENERATION.fetch_add(1, Ordering::SeqCst) + 1;
    let window = match app.get_webview_window(LABEL) {
        Some(window) => {
            app.emit_to(LABEL, "hud-message", &message)?;
            window
        }
        None => create(&app, &message)?,
    };
    place(&app, &window)?;
    window.show()?;

    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(VISIBLE_FOR).await;
        if GENERATION.load(Ordering::SeqCst) != generation {
            return;
        }
        if let Some(window) = handle.get_webview_window(LABEL) {
            // Closing frees the second webview; the next confirmation builds it again.
            let _ = window.close();
        }
    });
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sits_in_the_top_right_corner_of_the_monitor() {
        assert_eq!(corner((0, 0), (1920, 1080), 1.0), (1560, 44));
        assert_eq!(corner((0, 0), (2880, 1800), 2.0), (2160, 88));
    }

    #[test]
    fn follows_a_monitor_that_does_not_start_at_zero() {
        assert_eq!(corner((-1920, 0), (1920, 1080), 1.0), (-360, 44));
    }

    #[test]
    fn encodes_everything_that_is_not_url_safe() {
        assert_eq!(
            url_encode("Texto limpo · 2 quebras"),
            "Texto%20limpo%20%C2%B7%202%20quebras"
        );
        assert_eq!(url_encode("a-b_c.d~e"), "a-b_c.d~e");
    }
}
