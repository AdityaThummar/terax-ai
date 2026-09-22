use std::io;

use tauri::{
    menu::{Menu, MenuEvent, MenuId, MenuItem, PredefinedMenuItem, Submenu},
    AppHandle, Manager, Runtime,
};

const GUARDED_QUIT_MENU_ID: &str = "terax.quit";
const QUIT_ACCELERATOR: &str = "Command+Q";
const NEW_WINDOW_MENU_ID: &str = "terax.new_window";
const SETTINGS_MENU_ID: &str = "terax.settings";

#[allow(dead_code)]
fn invalid_default_menu(message: &'static str) -> tauri::Error {
    io::Error::new(io::ErrorKind::InvalidData, message).into()
}

fn is_guarded_quit(id: &MenuId) -> bool {
    id == GUARDED_QUIT_MENU_ID
}

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = Menu::default(app)?;
    let items = menu.items()?;

    if let Some(app_menu_item) = items.first().and_then(|item| item.as_submenu()) {
        let app_items = app_menu_item.items()?;
        let settings_item = MenuItem::with_id(
            app,
            SETTINGS_MENU_ID,
            "Settings\u{2026}",
            true,
            Some("Cmd+,"),
        )?;
        let sep = PredefinedMenuItem::separator(app)?;
        let insert_idx = app_items.len().saturating_sub(1);
        let _ = app_menu_item.insert(&sep, insert_idx);
        let _ = app_menu_item.insert(&settings_item, insert_idx);

        let app_items_updated = app_menu_item.items()?;
        if let Some(quit_index) = app_items_updated.len().checked_sub(1) {
            if let Some(native_quit) = app_items_updated[quit_index].as_predefined_menuitem() {
                let quit_text = native_quit.text().unwrap_or_else(|_| "Quit Terax".into());
                let guarded_quit = MenuItem::with_id(
                    app,
                    GUARDED_QUIT_MENU_ID,
                    quit_text,
                    true,
                    Some(QUIT_ACCELERATOR),
                )?;
                let _ = app_menu_item.remove_at(quit_index);
                let _ = app_menu_item.insert(&guarded_quit, quit_index);
            }
        }
    }

    let file_sub = if items.len() > 1 && items[1].as_submenu().is_some() {
        items[1].as_submenu().unwrap().clone()
    } else {
        let sub = Submenu::new(app, "File", true)?;
        let _ = menu.insert(&sub, 1);
        sub
    };
    let new_window_item = MenuItem::with_id(
        app,
        NEW_WINDOW_MENU_ID,
        "New Window",
        true,
        Some("Cmd+N"),
    )?;
    let sep = PredefinedMenuItem::separator(app)?;
    let _ = file_sub.insert(&new_window_item, 0);
    let _ = file_sub.insert(&sep, 1);

    Ok(menu)
}

pub fn handle_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    if event.id() == NEW_WINDOW_MENU_ID {
        if let Err(e) = crate::do_open_new_window(app) {
            log::error!("new_window menu: {e}");
        }
        return;
    }

    if event.id() == SETTINGS_MENU_ID {
        if let Err(e) = crate::do_open_settings_window(app, None) {
            log::error!("settings menu: {e}");
        }
        return;
    }

    if !is_guarded_quit(event.id()) {
        return;
    }

    let Some(main) = app.get_webview_window("main") else {
        app.exit(0);
        return;
    };

    let _ = main.unminimize();
    let _ = main.show();
    let _ = main.set_focus();
    if let Err(error) = main.close() {
        log::error!("could not request guarded app quit: {error}");
    }
}

#[cfg(test)]
mod tests {
    use super::{is_guarded_quit, GUARDED_QUIT_MENU_ID};
    use tauri::menu::MenuId;

    #[test]
    fn only_guarded_quit_id_requests_window_close() {
        assert!(is_guarded_quit(&MenuId::new(GUARDED_QUIT_MENU_ID)));
        assert!(!is_guarded_quit(&MenuId::new("unrelated")));
    }
}
