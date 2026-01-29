# Application Icons

This directory should contain the application icons for different platforms.

## Required Icons

- `32x32.png` - 32x32 pixel PNG icon
- `128x128.png` - 128x128 pixel PNG icon
- `128x128@2x.png` - 256x256 pixel PNG icon (for Retina displays)
- `icon.icns` - macOS icon bundle
- `icon.ico` - Windows icon

## Generating Icons

You can use tools like:
- `tauri icon` CLI command (generates all sizes from a source image)
- [Online icon generators](https://icon.kitchen/)
- ImageMagick for command-line conversion

## Example Command

```bash
npx tauri icon path/to/source-icon.png
```

This will generate all required icon sizes in this directory.
