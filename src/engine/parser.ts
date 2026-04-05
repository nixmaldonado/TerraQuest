import {
  Token,
  TokenType,
  ASTProgram,
  ASTBlock,
  ASTBody,
  ASTExpression,
  Diagnostic,
} from '../types/index'
import { tokenize } from './tokenizer'

class Parser {
  private tokens: Token[]
  private pos: number
  private diagnostics: Diagnostic[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
    this.diagnostics = []
  }

  // ── Helpers ──

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private advance(): Token {
    const token = this.tokens[this.pos]
    if (!this.isAtEnd()) {
      this.pos++
    }
    return token
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type
  }

  private match(type: TokenType): Token | null {
    if (this.check(type)) {
      return this.advance()
    }
    return null
  }

  private skipNewlines(): void {
    while (this.check(TokenType.NEWLINE)) {
      this.advance()
    }
  }

  private addDiagnostic(line: number, column: number, message: string): void {
    this.diagnostics.push({ line, column, message, severity: 'error' })
  }

  /**
   * Error recovery: skip tokens until we find a RBRACE or NEWLINE at the
   * current brace depth, or EOF.
   */
  private recover(): void {
    let depth = 0
    while (!this.isAtEnd()) {
      const t = this.peek()
      if (t.type === TokenType.LBRACE) {
        depth++
        this.advance()
      } else if (t.type === TokenType.RBRACE) {
        if (depth === 0) {
          // Don't consume the RBRACE — let the caller handle it
          return
        }
        depth--
        this.advance()
      } else if (t.type === TokenType.NEWLINE && depth === 0) {
        this.advance()
        return
      } else {
        this.advance()
      }
    }
  }

  // ── Grammar ──

  parse(): { ast: ASTProgram; diagnostics: Diagnostic[] } {
    const blocks: ASTBlock[] = []
    this.skipNewlines()

    while (!this.isAtEnd()) {
      const block = this.parseBlock()
      if (block) {
        blocks.push(block)
      }
      this.skipNewlines()
    }

    return {
      ast: { type: 'program', blocks },
      diagnostics: this.diagnostics,
    }
  }

  private parseBlock(): ASTBlock | null {
    this.skipNewlines()
    if (this.isAtEnd()) return null

    const typeToken = this.peek()
    if (typeToken.type !== TokenType.IDENTIFIER) {
      this.addDiagnostic(
        typeToken.line,
        typeToken.column,
        `Expected block type (resource, variable, output, provider), got '${typeToken.value || typeToken.type}'`
      )
      this.recover()
      return null
    }
    this.advance()

    // Labels (zero, one, or two STRING tokens before the opening brace)
    const labels: string[] = []
    while (this.check(TokenType.STRING)) {
      labels.push(this.advance().value)
    }
    this.skipNewlines()

    // Opening brace
    if (!this.match(TokenType.LBRACE)) {
      this.addDiagnostic(
        this.peek().line,
        this.peek().column,
        `Expected '{' after block declaration, got '${this.peek().value || this.peek().type}'`
      )
      this.recover()
      return {
        type: 'block',
        blockType: typeToken.value,
        labels,
        body: { assignments: {}, nestedBlocks: {} },
        line: typeToken.line,
        column: typeToken.column,
      }
    }

    const body = this.parseBody()

    // Closing brace
    if (!this.match(TokenType.RBRACE)) {
      this.addDiagnostic(
        this.peek().line,
        this.peek().column,
        `Expected '}' to close '${typeToken.value}' block`
      )
    }

    return {
      type: 'block',
      blockType: typeToken.value,
      labels,
      body,
      line: typeToken.line,
      column: typeToken.column,
    }
  }

  private parseBody(): ASTBody {
    const assignments: Record<string, ASTExpression> = {}
    const nestedBlocks: Record<string, ASTBody[]> = {}

    this.skipNewlines()

    while (!this.isAtEnd() && !this.check(TokenType.RBRACE)) {
      if (this.check(TokenType.NEWLINE)) {
        this.advance()
        continue
      }

      if (!this.check(TokenType.IDENTIFIER)) {
        this.addDiagnostic(
          this.peek().line,
          this.peek().column,
          `Expected identifier in block body, got '${this.peek().value || this.peek().type}'`
        )
        this.recover()
        continue
      }

      const nameToken = this.advance()
      this.skipNewlines()

      // Assignment: IDENTIFIER '=' expression
      if (this.check(TokenType.EQUALS)) {
        this.advance() // consume '='
        this.skipNewlines()
        const expr = this.parseExpression()
        if (expr) {
          assignments[nameToken.value] = expr
        }
        // Consume optional trailing newline
        this.match(TokenType.NEWLINE)
        continue
      }

      // Nested block: IDENTIFIER '{' body '}'
      if (this.check(TokenType.LBRACE)) {
        this.advance() // consume '{'
        const nested = this.parseBody()
        if (!this.match(TokenType.RBRACE)) {
          this.addDiagnostic(
            this.peek().line,
            this.peek().column,
            `Expected '}' to close nested block '${nameToken.value}'`
          )
        }
        if (!nestedBlocks[nameToken.value]) {
          nestedBlocks[nameToken.value] = []
        }
        nestedBlocks[nameToken.value].push(nested)
        this.skipNewlines()
        continue
      }

      // Unexpected token after identifier — recover
      this.addDiagnostic(
        this.peek().line,
        this.peek().column,
        `Expected '=' or '{' after '${nameToken.value}', got '${this.peek().value || this.peek().type}'`
      )
      this.recover()
    }

    return { assignments, nestedBlocks }
  }

  private parseExpression(): ASTExpression | null {
    const tok = this.peek()

    // String literal
    if (tok.type === TokenType.STRING) {
      this.advance()
      return { type: 'string', value: tok.value, line: tok.line, column: tok.column }
    }

    // Number literal
    if (tok.type === TokenType.NUMBER) {
      this.advance()
      return { type: 'number', value: parseFloat(tok.value), line: tok.line, column: tok.column }
    }

    // Boolean literal
    if (tok.type === TokenType.BOOL) {
      this.advance()
      return { type: 'bool', value: tok.value === 'true', line: tok.line, column: tok.column }
    }

    // List
    if (tok.type === TokenType.LBRACKET) {
      return this.parseList()
    }

    // Reference (IDENTIFIER possibly followed by DOT IDENTIFIER chains)
    if (tok.type === TokenType.IDENTIFIER) {
      return this.parseReference()
    }

    // Unexpected — record diagnostic and return null
    this.addDiagnostic(tok.line, tok.column, `Expected expression, got '${tok.value || tok.type}'`)
    this.recover()
    return null
  }

  private parseList(): ASTExpression {
    const open = this.advance() // consume '['
    const items: ASTExpression[] = []

    this.skipNewlines()

    while (!this.isAtEnd() && !this.check(TokenType.RBRACKET)) {
      const expr = this.parseExpression()
      if (expr) {
        items.push(expr)
      }
      this.skipNewlines()

      // Optional comma between items
      if (this.check(TokenType.COMMA)) {
        this.advance()
        this.skipNewlines()
      }
    }

    if (!this.match(TokenType.RBRACKET)) {
      this.addDiagnostic(this.peek().line, this.peek().column, "Expected ']' to close list")
    }

    return { type: 'list', items, line: open.line, column: open.column }
  }

  private parseReference(): ASTExpression {
    const first = this.advance() // consume initial IDENTIFIER
    const parts: string[] = [first.value]

    while (this.check(TokenType.DOT)) {
      this.advance() // consume '.'
      if (this.check(TokenType.IDENTIFIER)) {
        parts.push(this.advance().value)
      } else {
        // Dot with no following identifier (mid-typing) — still valid partial reference
        this.addDiagnostic(
          this.peek().line,
          this.peek().column,
          "Expected identifier after '.'"
        )
        break
      }
    }

    return { type: 'reference', parts, line: first.line, column: first.column }
  }
}

/**
 * Tokenize and parse an HCL input string, returning a partial AST and
 * any diagnostics. Never throws.
 */
export function parseHCL(input: string): { ast: ASTProgram; diagnostics: Diagnostic[] } {
  try {
    const tokens = tokenize(input)
    const parser = new Parser(tokens)
    return parser.parse()
  } catch {
    // Absolute fallback — should never happen, but guarantees no throw
    return {
      ast: { type: 'program', blocks: [] },
      diagnostics: [
        {
          line: 1,
          column: 1,
          message: 'Internal parser error',
          severity: 'error',
        },
      ],
    }
  }
}
