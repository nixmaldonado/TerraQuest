import React, { useEffect, useRef } from 'react'
import MonacoEditor, { OnMount } from '@monaco-editor/react'
import { useEditorStore } from '../store/editorStore'
import type { editor as MonacoEditorNS } from 'monaco-editor'

export const Editor: React.FC = () => {
  const code = useEditorStore((s) => s.code)
  const diagnostics = useEditorStore((s) => s.diagnostics)
  const setCode = useEditorStore((s) => s.setCode)
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco as typeof import('monaco-editor')

    // Register HCL language
    monaco.languages.register({ id: 'hcl' })

    monaco.languages.setMonarchTokensProvider('hcl', {
      keywords: [
        'resource', 'variable', 'output', 'provider',
        'module', 'data', 'locals', 'terraform',
      ],
      tokenizer: {
        root: [
          [/#.*$/, 'comment'],
          [/\/\/.*$/, 'comment'],
          [/"[^"]*"/, 'string'],
          [/\b(true|false)\b/, 'keyword.boolean'],
          [/\b\d+\b/, 'number'],
          [
            /[a-zA-Z_]\w*/,
            {
              cases: {
                '@keywords': 'keyword',
                '@default': 'identifier',
              },
            },
          ],
          [/[{}]/, 'delimiter.bracket'],
          [/[[\]]/, 'delimiter.square'],
          [/=/, 'operator'],
          [/\s+/, 'white'],
        ],
      },
    } as any)

    // Register custom dark theme
    monaco.editor.defineTheme('terraquest-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
        { token: 'keyword.boolean', foreground: '7c3aed' },
        { token: 'string', foreground: '10b981' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'operator', foreground: 'e2e8f0' },
        { token: 'delimiter.bracket', foreground: 'e2e8f0' },
        { token: 'delimiter.square', foreground: 'e2e8f0' },
      ],
      colors: {
        'editor.background': '#1e293b',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#64748b',
        'editorCursor.foreground': '#7c3aed',
        'editor.selectionBackground': '#334155',
        'editor.lineHighlightBackground': '#1e293b',
      },
    })

    monaco.editor.setTheme('terraquest-dark')
  }

  // Sync diagnostics to Monaco markers
  useEffect(() => {
    const monaco = monacoRef.current
    const editor = editorRef.current
    if (!monaco || !editor) return

    const model = editor.getModel()
    if (!model) return

    const markers = diagnostics.map((d) => ({
      startLineNumber: d.line,
      startColumn: d.column,
      endLineNumber: d.endLine ?? d.line,
      endColumn: d.endColumn ?? d.column + 1,
      message: d.message,
      severity:
        d.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : d.severity === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
    }))

    monaco.editor.setModelMarkers(model, 'hcl', markers)
  }, [diagnostics])

  return (
    <div className="h-full w-full overflow-hidden">
      <MonacoEditor
        language="hcl"
        theme="terraquest-dark"
        value={code}
        onChange={(value) => setCode(value ?? '')}
        onMount={handleMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 16 },
          automaticLayout: true,
        }}
      />
    </div>
  )
}
