use std::time::Duration;

use enigo::{Direction, Enigo, Key, Keyboard, Settings};

// Gives the person time to let go of the shortcut, and the target app time to see the new clipboard.
const SETTLE: Duration = Duration::from_millis(180);

#[derive(Debug, thiserror::Error)]
pub enum PasteError {
    #[error("the system has not allowed this app to control the keyboard")]
    NotAllowed,
    #[error("could not simulate the paste: {0}")]
    Input(String),
}

impl serde::Serialize for PasteError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

/// macOS only lets an app press keys for someone after they grant Accessibility access.
/// Windows has no such permission.
pub fn allowed(ask: bool) -> bool {
    #[cfg(target_os = "macos")]
    {
        use macos_accessibility_client::accessibility;
        if ask {
            accessibility::application_is_trusted_with_prompt()
        } else {
            accessibility::application_is_trusted()
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = ask;
        true
    }
}

const fn paste_modifier() -> Key {
    if cfg!(target_os = "macos") {
        Key::Meta
    } else {
        Key::Control
    }
}

pub fn paste() -> Result<(), PasteError> {
    if !allowed(false) {
        return Err(PasteError::NotAllowed);
    }
    std::thread::sleep(SETTLE);
    let settings = Settings {
        open_prompt_to_get_permissions: false,
        ..Settings::default()
    };
    let mut enigo = Enigo::new(&settings).map_err(|e| PasteError::Input(e.to_string()))?;
    // The cleaning shortcut can still be physically held. Lifting every modifier first makes the
    // paste a plain Ctrl+V or Cmd+V instead of that shortcut with a V on top.
    for held in [Key::Shift, Key::Alt, Key::Control, Key::Meta] {
        let _ = enigo.key(held, Direction::Release);
    }
    let modifier = paste_modifier();
    let input = |e: enigo::InputError| PasteError::Input(e.to_string());
    enigo.key(modifier, Direction::Press).map_err(input)?;
    let click = enigo.key(Key::Unicode('v'), Direction::Click);
    // Never leave the modifier stuck down, even if the V failed.
    let release = enigo.key(modifier, Direction::Release);
    click.map_err(input)?;
    release.map_err(input)
}

/// Asks for the permission when `ask` is true (this is what opens the system prompt on macOS).
#[tauri::command]
pub fn paste_allowed(ask: bool) -> bool {
    allowed(ask)
}

// Runs on a blocking thread: the pause and the key events must not hold up the async runtime.
#[tauri::command]
pub async fn simulate_paste() -> Result<(), PasteError> {
    tauri::async_runtime::spawn_blocking(paste)
        .await
        .map_err(|e| PasteError::Input(e.to_string()))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pastes_with_the_platform_modifier() {
        let expected = if cfg!(target_os = "macos") {
            Key::Meta
        } else {
            Key::Control
        };
        assert_eq!(paste_modifier(), expected);
    }

    #[test]
    fn windows_needs_no_permission() {
        if !cfg!(target_os = "macos") {
            assert!(allowed(true));
        }
    }
}
