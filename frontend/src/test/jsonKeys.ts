/**
 * Minimal JSON walker used by the translation integrity test.
 *
 * `JSON.parse` silently drops duplicate object keys (the last one wins), so a
 * duplicate in a translation file would be invisible to normal loading. This
 * walker reads the raw text instead and reports every duplicated key path.
 */

export interface JsonWalkResult {
  /** Dot-separated path of every object key encountered, in document order. */
  keys: string[]
  /** Dot-separated path of every key that appeared twice in the same object. */
  duplicates: string[]
}

export function walkJsonKeys(raw: string): JsonWalkResult {
  const keys: string[] = []
  const duplicates: string[] = []
  const stack: string[] = []
  let index = 0

  const fail = (message: string): never => {
    throw new Error(`${message} (offset ${index})`)
  }

  const skipWhitespace = () => {
    while (index < raw.length && /\s/.test(raw[index] as string)) {
      index += 1
    }
  }

  const parseString = (): string => {
    if (raw[index] !== '"') {
      fail('Expected a string')
    }
    index += 1
    let value = ''
    while (index < raw.length) {
      const character = raw[index] as string
      if (character === '\\') {
        value += raw.slice(index, index + 2)
        index += 2
        continue
      }
      if (character === '"') {
        index += 1
        return value
      }
      value += character
      index += 1
    }
    return fail('Unterminated string')
  }

  const parseValue = (): void => {
    skipWhitespace()
    const character = raw[index]

    if (character === '{') {
      index += 1
      const seen = new Set<string>()
      skipWhitespace()
      if (raw[index] === '}') {
        index += 1
        return
      }
      for (;;) {
        skipWhitespace()
        if (raw[index] !== '"') {
          fail('Expected an object key')
        }
        const key = parseString()
        const path = [...stack, key].join('.')
        if (seen.has(key)) {
          duplicates.push(path)
        }
        seen.add(key)
        keys.push(path)
        stack.push(key)
        skipWhitespace()
        if (raw[index] !== ':') {
          fail(`Expected ":" after key "${key}"`)
        }
        index += 1
        parseValue()
        stack.pop()
        skipWhitespace()
        if (raw[index] === ',') {
          index += 1
          continue
        }
        if (raw[index] === '}') {
          index += 1
          return
        }
        fail('Expected "," or "}"')
      }
    }

    if (character === '[') {
      index += 1
      skipWhitespace()
      if (raw[index] === ']') {
        index += 1
        return
      }
      for (;;) {
        parseValue()
        skipWhitespace()
        if (raw[index] === ',') {
          index += 1
          continue
        }
        if (raw[index] === ']') {
          index += 1
          return
        }
        fail('Expected "," or "]"')
      }
    }

    if (character === '"') {
      parseString()
      return
    }

    if (raw.startsWith('true', index)) {
      index += 4
      return
    }
    if (raw.startsWith('false', index)) {
      index += 5
      return
    }
    if (raw.startsWith('null', index)) {
      index += 4
      return
    }
    const numberMatch = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(raw.slice(index))
    if (numberMatch) {
      index += numberMatch[0].length
      return
    }
    return fail('Unexpected token')
  }

  parseValue()
  skipWhitespace()
  if (index !== raw.length) {
    fail('Unexpected trailing content')
  }

  return { keys, duplicates }
}
