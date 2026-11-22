// Opens the page given by CAMO_URL (default: the bundled probe page), lets the feature probe run in the webview,
// writes its JSON to CAMO_OUT and exits. Run with `cargo run`; nothing here ships.
use std::{env, fs, time::Duration};
use tauri::{WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn report(app: tauri::AppHandle, json: String) {
    let out = env::var("CAMO_OUT").unwrap_or_else(|_| "results-webview.json".into());
    fs::write(out, json).expect("write the probe result");
    app.exit(0);
}

fn main() {
    let url = env::var("CAMO_URL").ok();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![report])
        .setup(move |app| {
            let target = match &url {
                Some(u) => WebviewUrl::External(u.parse().expect("CAMO_URL is a URL")),
                None => WebviewUrl::default(),
            };
            let probe = include_str!("../../web/probe.js");
            let scenario = include_str!("../../web/scenario.js");
            // Runs once the page has loaded, after the page's own scripts: probe, then report to Rust.
            let init = format!(
                "window.addEventListener('load', async () => {{ try {{ if (!window.__TAURI__) throw new Error('no __TAURI__ on ' + location.href); {probe}\n{scenario}\n const r = await globalThis.__camoProbeRun(); \
                 r.scenario = await globalThis.__camoScenarioRun().catch((e) => String(e)); \
                 await window.__TAURI__.core.invoke('report', {{ json: JSON.stringify(r, null, 2) }}); }} catch (e) {{ console.error('probe failed: ' + e); }} }});"
            );
            WebviewWindowBuilder::new(app, "main", target)
                .title("Camouflage")
                .inner_size(900.0, 700.0)
                .initialization_script(&init)
                .build()?;
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_secs(60));
                eprintln!("the probe did not report within 60 seconds");
                handle.exit(1);
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("run the Tauri app");
}
