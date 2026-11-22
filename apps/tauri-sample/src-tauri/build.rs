fn main() {
    // `report` is the one command a page may call; a remote page can only call commands a capability allows.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["report"])),
    )
    .expect("build the Tauri app");
}
