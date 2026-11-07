use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIcon, TrayIconBuilder};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Clone, serde::Deserialize)]
pub struct TrayLabels {
    clean: String,
    restore: String,
    open: String,
    settings: String,
    quit: String,
}

impl Default for TrayLabels {
    fn default() -> Self {
        Self {
            clean: "Clean now".into(),
            restore: "Restore original".into(),
            open: "Open CleanCopy".into(),
            settings: "Settings…".into(),
            quit: "Quit".into(),
        }
    }
}

#[derive(Default)]
pub struct TrayState(Mutex<Option<TrayIcon>>);

fn build_menu(app: &AppHandle, labels: &TrayLabels) -> tauri::Result<Menu<tauri::Wry>> {
    let menu = Menu::new(app)?;
    menu.append(&MenuItem::with_id(
        app,
        "clean",
        &labels.clean,
        true,
        None::<&str>,
    )?)?;
    menu.append(&MenuItem::with_id(
        app,
        "restore",
        &labels.restore,
        true,
        None::<&str>,
    )?)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&MenuItem::with_id(
        app,
        "open",
        &labels.open,
        true,
        None::<&str>,
    )?)?;
    menu.append(&MenuItem::with_id(
        app,
        "settings",
        &labels.settings,
        true,
        None::<&str>,
    )?)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&MenuItem::with_id(
        app,
        "quit",
        &labels.quit,
        true,
        None::<&str>,
    )?)?;
    Ok(menu)
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let menu = build_menu(app, &TrayLabels::default())?;
    #[cfg(target_os = "macos")]
    let icon = tauri::include_image!("icons/tray.png");
    #[cfg(not(target_os = "macos"))]
    let icon = tauri::include_image!("icons/tray-color.png");

    let tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .icon_as_template(cfg!(target_os = "macos"))
        .tooltip("CleanCopy")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => show_main_window(app),
            "settings" => {
                show_main_window(app);
                let _ = app.emit("tray-action", "settings");
            }
            "clean" => {
                let _ = app.emit("tray-action", "clean");
            }
            "restore" => {
                let _ = app.emit("tray-action", "restore");
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    *app.state::<TrayState>().0.lock().unwrap() = Some(tray);
    Ok(())
}

#[tauri::command]
pub fn set_tray_labels(
    app: AppHandle,
    state: State<TrayState>,
    labels: TrayLabels,
) -> Result<(), String> {
    let menu = build_menu(&app, &labels).map_err(|e| e.to_string())?;
    if let Some(tray) = state.0.lock().unwrap().as_ref() {
        tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    }
    Ok(())
}
