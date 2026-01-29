# Application Icons

This directory should contain the application icons for different platforms.

## Required Icons for Windows

- `32x32.png` - 32x32 pixel PNG icon
- `128x128.png` - 128x128 pixel PNG icon
- `128x128@2x.png` - 256x256 pixel PNG icon
- `icon.ico` - Windows icon (primary)
- `icon.icns` - macOS icon (for cross-compilation)

## Generating Icons

Use the Tauri CLI to generate all required icon sizes from a source image:

```bash
npx tauri icon path/to/source-icon.png
```

This will generate all required icon sizes in this directory.

## Windows-specific Notes

- The `icon.ico` is used for the application executable and installer
- NSIS installer uses the icon specified in `tauri.conf.json`
- Recommended source image: at least 1024x1024 pixels, PNG format
