/**
 * V4 B2.5 — Axes pattern parser
 *
 * Detects the universal "N axes ou je peux affiner ... Lequel je lance ?"
 * suffix that the Response Quality Standard (B2.2) instructs every agent
 * to emit. When detected, the pattern is split out so the chat UI can
 * render the axes as clickable buttons instead of plain text.
 *
 * Returns null when the pattern is not present so the caller can fall
 * back to normal markdown rendering.
 */

export interface AxesPattern {
  /** Markdown content before the axes section (rendered normally). */
  beforeAxes: string;
  /** Intro line such as "3 axes ou je peux affiner :" — kept for label. */
  intro: string;
  /** Each axe stripped of its numbering and the optional trailing "?". */
  axes: string[];
  /** Tail after the axes (typically "Lequel je lance ?"). May be empty. */
  outro: string;
}

// ─────────────────────────────────────────────────────────────────
// Heuristics
// ─────────────────────────────────────────────────────────────────

// Intro variants — anchored to a line start, count between 2 and 5.
const INTRO_REGEX =
  /^\s*([2-5])\s+axes?\b[^\n]*?(?:peux\s+affiner|je\s+peux\s+affiner|d'?affinement)[^\n]*$/im;

// Outro candidates that close the axes block.
const OUTRO_PATTERNS: RegExp[] = [
  /^\s*lequel\s+je\s+lance\s*\??\s*$/i,
  /^\s*lequel\s+veux[- ]tu\s*\??\s*$/i,
  /^\s*on\s+commence\s+par\s+lequel\s*\??\s*$/i,
  /^\s*quel\s+axe\s+je\s+lance\s*\??\s*$/i,
  /^\s*lequel\s+choisis[- ]tu\s*\??\s*$/i,
];

// An axe line: starts with 1. / 1) / - / *  followed by content.
// Captures the body so we can strip the bullet/number.
const AXE_LINE_REGEX = /^\s*(?:(?:[1-9])(?:\.|\))|[-*•])\s+(.+?)\s*$/;

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function stripWrappingQuotes(value: string): string {
  return value.replace(/^["'`«»]+/, '').replace(/["'`«»]+$/, '').trim();
}

/** Remove leading markdown emphasis markers ("**", "*", "_") that the
 * LLM sometimes adds inside the axe body. Keeps the readable content. */
function stripEmphasis(value: string): string {
  return value.replace(/^\*+/, '').replace(/\*+$/, '').trim();
}

/**
 * V4 B2.5p2 — Strip markdown decorations that wrap a whole line:
 * heading hashes (`## ###`), bold/italic markers (`**`, `*`, `__`, `_`).
 * Used to normalize intro/outro lines BEFORE matching their regex so the
 * parser tolerates `## 3 axes ou je peux affiner :`,
 * `**Lequel je lance ?**`, and combinations.
 */
function stripMarkdownDecorations(line: string): string {
  let s = line.trim();
  s = s.replace(/^#{1,6}\s+/, '');     // strip headings (##, ###...)
  s = s.replace(/^\*+\s*/, '');         // leading bold/italic *
  s = s.replace(/\s*\*+$/, '');         // trailing bold/italic *
  s = s.replace(/^_+\s*/, '');          // leading bold/italic _
  s = s.replace(/\s*_+$/, '');          // trailing bold/italic _
  return s.trim();
}

/**
 * V4 B2.5p2 — Flatten markdown inline emphasis anywhere in the line.
 * Covers `## **3** axes ...` (heading + mid-line bold) and the
 * `1. **Foo** body` axe pattern (bold token at start of body). Negative
 * lookarounds keep `*foo*` italic conversion from clobbering `**bold**`
 * when both are present.
 */
function flattenInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*([^*]+)\*\*/g, '$1')                  // **bold** → bold
    .replace(/__([^_]+)__/g, '$1')                       // __bold__ → bold
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')          // *italic* → italic
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1');             // _italic_ → italic
}

function normalizeAxe(raw: string): string {
  // Strip a trailing "?" (we add visual cues via UI instead).
  const noQuestion = raw.replace(/\s*\?\s*$/, '').trim();
  // V4 B2.5p2 — flatten any inline markdown so buttons display clean labels.
  const flattened = flattenInlineMarkdown(noQuestion);
  return stripEmphasis(stripWrappingQuotes(flattened));
}

// ─────────────────────────────────────────────────────────────────
// Main parser
// ─────────────────────────────────────────────────────────────────

export function parseAxesPattern(content: string): AxesPattern | null {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');

  // Find intro line (last occurrence to avoid matching mid-message references).
  // V4 B2.5p2 — normalize markdown decorations BEFORE regex match so the
  // parser tolerates "## 3 axes...", "**3 axes...**", "## **3** axes..." etc.
  let introIndex = -1;
  let expectedCount = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const normalized = stripMarkdownDecorations(flattenInlineMarkdown(lines[i]));
    const m = normalized.match(INTRO_REGEX);
    if (m) {
      introIndex = i;
      expectedCount = parseInt(m[1], 10);
      break;
    }
  }
  if (introIndex === -1) return null;

  // Walk forward from intro and collect axe lines, allowing blank lines.
  const collected: string[] = [];
  let lastAxeIndex = introIndex;
  for (let i = introIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      if (collected.length === 0) continue; // tolerate blank between intro and first axe
      // blank line after we started collecting → stop
      break;
    }
    const m = line.match(AXE_LINE_REGEX);
    if (m) {
      collected.push(normalizeAxe(m[1]));
      lastAxeIndex = i;
      if (collected.length >= expectedCount) break;
      continue;
    }
    // First non-axe non-blank after starting collection → stop
    if (collected.length > 0) break;
    // Tolerate one stray non-axe line before the first axe (rare LLM noise)
    if (i - introIndex > 2) return null;
  }

  if (collected.length < 2) return null; // pattern not strong enough

  // Trim collected to expected count when LLM spits more
  const axes = collected.slice(0, Math.max(2, Math.min(5, expectedCount || collected.length)));

  // Detect outro line within the next few lines after the last axe.
  // V4 B2.5p2 — same normalization as intro so "**Lequel je lance ?**"
  // and "## **Lequel je lance ?**" both match.
  let outro = '';
  for (let i = lastAxeIndex + 1; i < Math.min(lines.length, lastAxeIndex + 4); i++) {
    const rawTrim = lines[i].trim();
    if (!rawTrim) continue;
    const candidate = stripMarkdownDecorations(flattenInlineMarkdown(rawTrim));
    if (OUTRO_PATTERNS.some((re) => re.test(candidate))) {
      outro = candidate;
      break;
    }
    // Non-empty non-outro line right after axes → no outro detected, stop.
    break;
  }

  const beforeAxes = lines.slice(0, introIndex).join('\n').trimEnd();
  const intro = lines[introIndex].trim();

  // Sanity: if axes < 2 after parse, abort to avoid weird single-button UI
  if (axes.length < 2) return null;

  // Drop a trailing closing quote wrapper that some agents add around the
  // entire deliverable (e.g. `..."`).
  const cleanBefore = beforeAxes.replace(/^"+/, '').replace(/"+\s*$/, '');

  return {
    beforeAxes: cleanBefore,
    intro,
    axes,
    outro,
  };
}
