import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { resources } from './index'
import { DEFAULT_LANGUAGE, NAMESPACES, SUPPORTED_LANGUAGES } from './config'
import { walkJsonKeys } from '@/test/jsonKeys'

const localesDir = join(process.cwd(), 'src/i18n/locales')
const srcDir = join(process.cwd(), 'src')

type LanguageBundle = Record<string, unknown>

function bundleFor(language: string): LanguageBundle {
  return (resources as Record<string, LanguageBundle>)[language] ?? {}
}

/** Flattens a resource object into `namespace:dot.separated.key` → leaf value. */
function flatten(namespace: string, value: unknown): Map<string, string> {
  const flat = new Map<string, string>()

  const visit = (current: unknown, path: string) => {
    if (typeof current === 'string') {
      flat.set(`${namespace}:${path}`, current)
      return
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}.${index}`))
      return
    }
    if (current && typeof current === 'object') {
      for (const [key, child] of Object.entries(current)) {
        visit(child, path ? `${path}.${key}` : key)
      }
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      visit(child, key)
    }
  }

  return flat
}

function allKeys(language: string): Map<string, string> {
  const bundle = bundleFor(language)
  const flat = new Map<string, string>()
  for (const namespace of NAMESPACES) {
    for (const [key, value] of flatten(namespace, bundle[namespace])) {
      flat.set(key, value)
    }
  }
  return flat
}

const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'] as const

function keyExists(keys: Map<string, string>, fullKey: string): boolean {
  if (keys.has(fullKey)) return true
  return PLURAL_SUFFIXES.some((suffix) => keys.has(`${fullKey}${suffix}`))
}

function stripPluralSuffix(key: string): string {
  for (const suffix of PLURAL_SUFFIXES) {
    if (key.endsWith(suffix)) return key.slice(0, -suffix.length)
  }
  return key
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { recursive: true })
    .filter((file): file is string => typeof file === 'string')
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => !file.includes('/locales/'))
    .filter((file) => !/\.test\.tsx?$/.test(file))
    .map((file) => join(directory, file))
}

/**
 * Keys resolved at runtime rather than written as literals: the validation
 * layer builds `${fieldId}.${code}` and `Alert` reads a variant key out of
 * `noticeStyles`. Without this allowance they would look unused.
 */
const DYNAMIC_KEY_PATTERNS: RegExp[] = [
  /^validation:(loanAmount|loanTerm|monthlyIncome|monthlyExpenses|existingDebt)\./,
  /^accessibility:notice\./,
]

interface SourceReferences {
  /** Fully-qualified `namespace:key` literals found in the file. */
  prefixed: Set<string>
  /** Bare key literals, resolved against every namespace the file imports. */
  bare: Array<{ key: string; namespaces: string[] }>
}

function readNamespacesUsed(source: string): string[] {
  const namespaces: string[] = []
  const hookPattern = /useTranslation\(\s*(\[[^\]]*\]|'[^']*'|"[^"]*")/g
  let match: RegExpExecArray | null
  while ((match = hookPattern.exec(source)) !== null) {
    const argument = match[1] ?? ''
    const quotedPattern = /'([^']+)'|"([^"]+)"/g
    let quotedMatch: RegExpExecArray | null
    while ((quotedMatch = quotedPattern.exec(argument)) !== null) {
      namespaces.push(quotedMatch[1] ?? quotedMatch[2] ?? '')
    }
  }
  return namespaces
}

function collectReferences(file: string): SourceReferences {
  const source = readFileSync(file, 'utf8')
  const namespaces = readNamespacesUsed(source)
  const references: SourceReferences = { prefixed: new Set(), bare: [] }

  const record = (literal: string) => {
    const colonIndex = literal.indexOf(':')
    if (colonIndex > 0) {
      references.prefixed.add(literal)
      return
    }
    references.bare.push({ key: literal, namespaces })
  }

  const patterns = [
    // Matches `t('…')`, `tValidation('…')` and `i18n.t('…')` — aliases are
    // needed when a component draws on more than one namespace.
    /\bt[A-Za-z0-9]*\(\s*(['"])([^'"]+)\1/g,
    /i18nKey=\s*\{?\s*(['"])([^'"]+)\1\s*\}?/g,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source)) !== null) {
      record(match[2] ?? '')
    }
  }

  return references
}

function collectAllReferences(): Set<string> {
  const referenced = new Set<string>()
  for (const file of listSourceFiles(srcDir)) {
    const { prefixed, bare } = collectReferences(file)
    for (const fullKey of prefixed) referenced.add(fullKey)
    for (const { key, namespaces } of bare) {
      for (const namespace of namespaces) referenced.add(`${namespace}:${key}`)
    }
  }
  return referenced
}

describe('translation resources', () => {
  it('ships one JSON file per namespace for each supported language', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const files = readdirSync(join(localesDir, language))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace(/\.json$/, ''))
        .sort()

      expect(files).toEqual([...NAMESPACES].sort())
    }
  })

  it('parses every translation file with no duplicate keys or empty values', () => {
    const problems: string[] = []

    for (const language of SUPPORTED_LANGUAGES) {
      for (const namespace of NAMESPACES) {
        const file = join(localesDir, language, `${namespace}.json`)
        const raw = readFileSync(file, 'utf8')

        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch (error) {
          problems.push(`${language}/${namespace}.json is not valid JSON: ${String(error)}`)
          continue
        }

        for (const duplicate of walkJsonKeys(raw).duplicates) {
          problems.push(`${language}/${namespace}.json has a duplicate key: ${duplicate}`)
        }

        for (const [key, value] of flatten(namespace, parsed)) {
          if (value.trim().length === 0) {
            problems.push(`${language}/${namespace}.json has an empty value for ${key}`)
          }
          if (value !== value.trim()) {
            problems.push(`${language}/${namespace}.json has stray whitespace for ${key}`)
          }
        }

        if (Object.keys(parsed as object).length === 0) {
          problems.push(`${language}/${namespace}.json is empty`)
        }
      }
    }

    expect(problems).toEqual([])
  })

  it('only references namespaces and keys that exist', () => {
    const keys = allKeys(DEFAULT_LANGUAGE)
    const problems: string[] = []

    for (const file of listSourceFiles(srcDir)) {
      const { prefixed, bare } = collectReferences(file)
      const shortName = file.replace(srcDir, 'src')

      for (const fullKey of prefixed) {
        const colonIndex = fullKey.indexOf(':')
        const namespace = fullKey.slice(0, colonIndex)
        if (!NAMESPACES.includes(namespace as (typeof NAMESPACES)[number])) {
          problems.push(`${shortName} references unknown namespace "${namespace}" (${fullKey})`)
          continue
        }
        if (!keyExists(keys, fullKey)) {
          problems.push(`${shortName} references a missing key ${fullKey}`)
        }
      }

      for (const { key, namespaces } of bare) {
        if (namespaces.length === 0) {
          problems.push(`${shortName} uses t('${key}') without useTranslation() namespaces`)
          continue
        }
        const found = namespaces.some((namespace) => keyExists(keys, `${namespace}:${key}`))
        if (!found) {
          problems.push(`${shortName} references a missing key (${namespaces.join(', ')}): ${key}`)
        }
      }
    }

    expect(problems).toEqual([])
  })

  it('has no unused keys beyond the documented dynamic references', () => {
    const keys = allKeys(DEFAULT_LANGUAGE)
    const referenced = collectAllReferences()

    const unused: string[] = []
    for (const fullKey of keys.keys()) {
      if (DYNAMIC_KEY_PATTERNS.some((pattern) => pattern.test(fullKey))) continue
      const base = stripPluralSuffix(fullKey)
      const matchesLiteral = [...referenced].some(
        (candidate) => stripPluralSuffix(candidate) === base,
      )
      if (!matchesLiteral) unused.push(fullKey)
    }

    expect(unused).toEqual([])
  })

  it('leaves no user-facing English sentences in application source', () => {
    const problems: string[] = []

    /** Removes comments so JSDoc prose is not mistaken for shipped copy. */
    const stripComments = (source: string): string =>
      source
        .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, ''))
        .join('\n')

    const userFacingProps =
      /\b(label|title|heading|description|hint|placeholder|content|children|aria-label)=\{?"[^"]*[a-z][^"]*"/
    // `>Sentence start<` on one line (inline JSX text).
    const inlineJsxText = />\s*[A-Z][a-z]+ [a-z]+/
    // Three-line JSX shape: `<tag>`, prose, `</tag>`.
    const proseLine = /^[A-Z][a-z]+(?:[ -][a-z'’]+)+[.!?,]?$/
    // A multi-word English sentence hiding in a string literal.
    const proseLiteral = /(['"`])((?:[A-Z][a-z]+)(?:[ -][a-z'’]+){2,})\1/

    for (const file of listSourceFiles(srcDir)) {
      // Test helpers and resources are not shipped UI copy.
      if (file.includes('/test/')) continue
      if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue
      const raw = readFileSync(file, 'utf8')
      const source = stripComments(raw)
      const lines = source.split('\n')
      const shortName = file.replace(srcDir, 'src')

      lines.forEach((line, index) => {
        const location = `${shortName}:${index + 1}`
        const trimmed = line.trim()

        if (userFacingProps.test(line)) {
          problems.push(`${location} looks like a hardcoded label: ${raw.split('\n')[index]?.trim() ?? trimmed}`)
        }

        const previous = (lines[index - 1] ?? '').trim()
        const next = (lines[index + 1] ?? '').trim()
        const isJsxTextBlock =
          previous.endsWith('>') && !previous.endsWith('/>') && next.startsWith('</') && proseLine.test(trimmed)
        if (isJsxTextBlock) {
          problems.push(`${location} looks like hardcoded JSX text: ${(raw.split('\n')[index] ?? '').trim()}`)
        }

        if (inlineJsxText.test(line)) {
          problems.push(`${location} looks like hardcoded JSX text: ${(raw.split('\n')[index] ?? trimmed).trim()}`)
        }

        const literal = proseLiteral.exec(line)
        if (literal) {
          problems.push(`${location} looks like a hardcoded English sentence: ${(raw.split('\n')[index] ?? '').trim()}`)
        }
      })
    }

    expect(problems).toEqual([])
  })
})
