# XMCL Log Viewer

A web-based log monitor/analyzer for XMCL style report zip bundles. Built with Vite + Vue 3 + TypeScript + Monaco.

## Features
- Load one or multiple report `.zip` files (drag via file input or folder picker)
- Recursively parse nested timestamp zip files
- Extract and render `device.json` metadata
- List all `.log` files (including those inside nested zips)
- View logs in a Monaco Editor instance (read-only, wrapped)
- Filter lines via regex / substring
- File System Access API folder selection (where supported) to batch import zips

## Dev Setup

```bash
pnpm install
pnpm dev
```

## Build
```bash
pnpm build
pnpm preview
```

## Notes
- No backend: all parsing is in-browser using JSZip.
- Large zips: parsing is sequential now; can be parallelized later.
- Security: File content never leaves the browser.

## Future Ideas
- Persist last viewed report (IndexedDB)
- Advanced search across all logs
- Colorize log levels (INFO/WARN/ERROR)
- Virtualized huge log display
- Download filtered result
```
