// Tiny loader for unit tests: transpile src/lib/*.ts and resolve './x' imports to modules already loaded
// (no bundler, no extra deps). Usage: const L = await loadLib(['theme', 'color', 'brandTheme'])
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import ts from 'typescript'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
export const read = f => readFileSync(path.join(root, f), 'utf8')

export async function loadLib(names, overrides = {}) {
  globalThis.__libs = globalThis.__libs || {}
  const out = {}
  for (const name of names) {
    let src = overrides[name] ?? read(`src/lib/${name}.ts`)
    src = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
    src = src.replace(/import\s*\{([^}]*)\}\s*from\s*['"](?:\.\/|@\/lib\/)([\w]+)['"];?/g, (_, names, mod) => {
      const list = names.split(',').map(s => s.trim()).filter(Boolean).map(s => s.replace(/\s+as\s+/, ': '))
      return `const { ${list.join(', ')} } = globalThis.__libs[${JSON.stringify(mod)}];`
    })
    const m = await import('data:text/javascript;base64,' + Buffer.from(src + `\n//${Math.random()}`).toString('base64'))
    globalThis.__libs[name] = m
    out[name] = m
  }
  return out
}
