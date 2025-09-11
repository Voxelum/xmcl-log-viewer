import * as monaco from 'monaco-editor'

let registered = false

export function ensureLogLanguage() {
    if (registered) return
    registered = true
    const id = 'xmcl-log'
    monaco.languages.register({ id })
    monaco.languages.setMonarchTokensProvider(id, {
        // Recognize multiple timestamp styles produced by toLocaleString across locales.
        // Examples:
        //  [2025/9/10 上午12:03:03]
        //  [2025/09/10 12:03:03]
        //  [2025-09-10 00:03:03]
        //  [2025-09-10T00:03:03.123Z]
        //  [10/9/2025, 12:03:03 AM]
        //  [9/10/2025, 12:03:03 AM]
        // We'll match generously but keep brackets boundary.
        tokenizer: {
            root: [
                [/^\[INFO\]/, 'severity.info'],
                [/^\[WARN\]/, 'severity.warn'],
                [/^\[ERROR\]/, 'severity.error'],
                [/^\[DEBUG\]/, 'severity.debug'],
                // Timestamp formats (split for readability):
                // 1. ISO-like: [2025-09-10T00:03:03.123Z] or without Z / ms
                [/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?\]/, 'timestamp'],
                // 2. Standard date-time with space or 'T': [2025-09-10 00:03:03] / [2025/9/10 0:03:03]
                [/\[\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}[ T]\d{1,2}:\d{2}:\d{2}(?:\.\d{1,3})?\]/, 'timestamp'],
                // 3. Chinese locale with 上午/下午 possibly before or after time: [2025/9/10 上午12:03:03]
                [/\[\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\s?(?:上午|下午)?\s?\d{1,2}:\d{2}:\d{2}(?:\.\d{1,3})?\s?(?:上午|下午)?\]/, 'timestamp'],
                // 4. US style with AM/PM and optional comma: [9/10/2025, 12:03:03 AM]
                [/\[\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4},?\s\d{1,2}:\d{2}:\d{2}\s?(?:AM|PM)\]/, 'timestamp'],
                // Area tag: [AreaName]
                [/\[[A-Za-z0-9_.:-]{2,}\]/, 'area'],
                // JSON blocks inline after severity/time/area - attempt to highlight keys & strings
                [/{/, { token: 'brace', next: '@jsonRoot' }],
                // Stack trace lines (simple heuristic)
                [/^\s+at\b.*$/, 'stack'],
            ],
            jsonRoot: [
                [/"[^"\\]*(?:\\.[^"\\]*)*"\s*:/, 'json.key'],
                [/"[^"\\]*(?:\\.[^"\\]*)*"/, 'string'],
                [/\b(true|false|null)\b/, 'keyword'],
                [/[-]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+\-]?\d+)?/, 'number'],
                [/{/, 'brace', '@push'],
                [/}/, 'brace', '@pop'],
                [/\[/, 'brace', '@push'],
                [/]/, 'brace', '@pop'],
                [/[,]/, 'delimiter'],
                [/\s+/, 'white'],
            ],
        },
    })

    monaco.editor.defineTheme('xmcl-log-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'severity.info', foreground: '4aa3ff', fontStyle: 'bold' },
            { token: 'severity.warn', foreground: 'd8b400', fontStyle: 'bold' },
            { token: 'severity.error', foreground: 'ff5f56', fontStyle: 'bold' },
            { token: 'severity.debug', foreground: '888888' },
            { token: 'timestamp', foreground: 'cca500' },
            { token: 'area', foreground: 'c586c0' },
            { token: 'stack', foreground: 'bbbbbb', fontStyle: 'italic' },
            { token: 'json.key', foreground: '9cdcfe' },
            { token: 'string', foreground: 'ce9178' },
            { token: 'number', foreground: 'b5cea8' },
            { token: 'keyword', foreground: '569cd6' },
            { token: 'brace', foreground: 'd4d4d4' },
            { token: 'delimiter', foreground: 'd4d4d4' },
        ],
        colors: {},
    })
}
