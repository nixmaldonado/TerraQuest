import { Token, TokenType } from '../types/index'

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let pos = 0
  let line = 1
  let column = 1

  function peek(): string {
    return pos < input.length ? input[pos] : '\0'
  }

  function advance(): string {
    const ch = input[pos]
    pos++
    if (ch === '\n') {
      line++
      column = 1
    } else {
      column++
    }
    return ch
  }

  function addToken(type: TokenType, value: string, startLine: number, startCol: number): void {
    tokens.push({ type, value, line: startLine, column: startCol })
  }

  while (pos < input.length) {
    const ch = peek()

    // Skip spaces and tabs (not newlines)
    if (ch === ' ' || ch === '\t') {
      advance()
      continue
    }

    // Newlines — collapse consecutive into one token
    if (ch === '\n') {
      const startLine = line
      const startCol = column
      advance()
      while (pos < input.length && peek() === '\n') {
        advance()
      }
      addToken(TokenType.NEWLINE, '\n', startLine, startCol)
      continue
    }

    // Carriage return (handle \r\n and bare \r)
    if (ch === '\r') {
      advance()
      continue
    }

    // Comments: # or //
    if (ch === '#') {
      while (pos < input.length && peek() !== '\n') {
        advance()
      }
      continue
    }
    if (ch === '/' && pos + 1 < input.length && input[pos + 1] === '/') {
      while (pos < input.length && peek() !== '\n') {
        advance()
      }
      continue
    }

    // Strings
    if (ch === '"') {
      const startLine = line
      const startCol = column
      advance() // opening quote
      let value = ''
      while (pos < input.length && peek() !== '"') {
        if (peek() === '\\' && pos + 1 < input.length) {
          advance() // backslash
          const escaped = advance()
          if (escaped === '"') {
            value += '"'
          } else if (escaped === 'n') {
            value += '\n'
          } else if (escaped === 't') {
            value += '\t'
          } else if (escaped === '\\') {
            value += '\\'
          } else {
            value += '\\' + escaped
          }
        } else if (peek() === '\n') {
          // Unterminated string at newline — break out
          break
        } else {
          value += advance()
        }
      }
      if (pos < input.length && peek() === '"') {
        advance() // closing quote
      }
      addToken(TokenType.STRING, value, startLine, startCol)
      continue
    }

    // Numbers
    if (ch >= '0' && ch <= '9') {
      const startLine = line
      const startCol = column
      let num = ''
      while (pos < input.length && peek() >= '0' && peek() <= '9') {
        num += advance()
      }
      if (pos < input.length && peek() === '.') {
        num += advance()
        while (pos < input.length && peek() >= '0' && peek() <= '9') {
          num += advance()
        }
      }
      addToken(TokenType.NUMBER, num, startLine, startCol)
      continue
    }

    // Identifiers and booleans
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      const startLine = line
      const startCol = column
      let ident = ''
      while (pos < input.length) {
        const c = peek()
        if (
          (c >= 'a' && c <= 'z') ||
          (c >= 'A' && c <= 'Z') ||
          (c >= '0' && c <= '9') ||
          c === '_' ||
          c === '-'
        ) {
          ident += advance()
        } else {
          break
        }
      }
      if (ident === 'true' || ident === 'false') {
        addToken(TokenType.BOOL, ident, startLine, startCol)
      } else {
        addToken(TokenType.IDENTIFIER, ident, startLine, startCol)
      }
      continue
    }

    // Single-character tokens
    const startLine = line
    const startCol = column
    advance()

    switch (ch) {
      case '=':
        addToken(TokenType.EQUALS, '=', startLine, startCol)
        break
      case '{':
        addToken(TokenType.LBRACE, '{', startLine, startCol)
        break
      case '}':
        addToken(TokenType.RBRACE, '}', startLine, startCol)
        break
      case '[':
        addToken(TokenType.LBRACKET, '[', startLine, startCol)
        break
      case ']':
        addToken(TokenType.RBRACKET, ']', startLine, startCol)
        break
      case '.':
        addToken(TokenType.DOT, '.', startLine, startCol)
        break
      case ',':
        addToken(TokenType.COMMA, ',', startLine, startCol)
        break
      default:
        // Skip unrecognized characters
        break
    }
  }

  addToken(TokenType.EOF, '', line, column)
  return tokens
}
