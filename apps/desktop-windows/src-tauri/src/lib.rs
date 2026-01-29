//! GenomeForge Desktop Application for Windows
//!
//! Tauri-based desktop application for privacy-first genetic analysis.

use serde::{Deserialize, Serialize};
use tauri::Manager;

mod commands;

/// Application state shared across windows
#[derive(Default)]
pub struct AppState {
    /// Whether genome data has been loaded
    pub genome_loaded: std::sync::atomic::AtomicBool,
}

/// Result type for genome analysis
#[derive(Debug, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub total_variants: usize,
    pub clinical_findings: usize,
    pub drug_responses: usize,
    pub trait_associations: usize,
}

/// Configuration for the application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Initialize app state
            app.manage(AppState::default());

            // Set up Windows-specific features
            #[cfg(windows)]
            {
                setup_windows(app.handle())?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_app_version,
            commands::get_system_info,
            commands::parse_genome_file,
            commands::analyze_variants,
            commands::export_report,
            commands::get_database_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(windows)]
fn setup_windows<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    // Windows-specific setup can go here
    // For example: Windows notification configuration, etc.
    let _ = app; // Silence unused variable warning for now
    Ok(())
}
