import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface Segment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

interface Block {
  type: 'paragraph' | 'bullet' | 'ordered';
  segments: Segment[];
  index?: number;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Parse inline tags (b/strong/i/em/u) into styled segments.
// Never strips formatting — always preserves bold/italic/underline state.
function parseInline(html: string): Segment[] {
  const segments: Segment[] = [];
  let bold = 0, italic = 0, underline = 0;
  const tagRe = /<(\/?)(b|strong|i|em|u)(?:\s[^>]*)?>/gi;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(html)) !== null) {
    if (m.index > last) {
      const text = decodeEntities(html.slice(last, m.index).replace(/<[^>]*>/g, ''));
      if (text) segments.push({ text, bold: bold > 0, italic: italic > 0, underline: underline > 0 });
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const d = closing ? -1 : 1;
    if (tag === 'b' || tag === 'strong') bold = Math.max(0, bold + d);
    else if (tag === 'i' || tag === 'em') italic = Math.max(0, italic + d);
    else if (tag === 'u') underline = Math.max(0, underline + d);
    last = m.index + m[0].length;
  }

  if (last < html.length) {
    const text = decodeEntities(html.slice(last).replace(/<[^>]*>/g, ''));
    if (text) segments.push({ text, bold: bold > 0, italic: italic > 0, underline: underline > 0 });
  }

  if (segments.length === 0) {
    const plain = decodeEntities(html.replace(/<[^>]*>/g, ''));
    if (plain.trim()) segments.push({ text: plain, bold: false, italic: false, underline: false });
  }

  return segments;
}

// Push a paragraph block only if it contains non-empty text.
// Always calls parseInline so inline formatting is preserved.
function addParagraph(blocks: Block[], html: string) {
  const segs = parseInline(html);
  if (segs.some((s) => s.text.trim())) {
    blocks.push({ type: 'paragraph', segments: segs });
  }
}

function parseBlocks(html: string): Block[] {
  const blocks: Block[] = [];

  // Strip structural-only tags that carry no content/formatting.
  // Keep p, li, br — those define block boundaries.
  const cleaned = html.replace(/<\/?(div|span|ul|ol)[^>]*>/gi, '');

  // Match block-level elements: <li>, <p>, <br>
  const blockRe = /<li[^>]*>([\s\S]*?)<\/li>|<p[^>]*>([\s\S]*?)<\/p>|<br\s*\/?>/gi;
  let last = 0;
  let liIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = blockRe.exec(cleaned)) !== null) {
    // Content BEFORE this block element — must go through parseInline, not tag-strip
    if (m.index > last) {
      addParagraph(blocks, cleaned.slice(last, m.index));
    }

    const [full, liContent, pContent] = m;

    if (liContent !== undefined) {
      const segs = parseInline(liContent);
      if (segs.some((s) => s.text.trim())) {
        blocks.push({ type: 'bullet', segments: segs });
      }
    } else if (pContent !== undefined) {
      const segs = parseInline(pContent);
      if (segs.some((s) => s.text.trim())) {
        blocks.push({ type: 'paragraph', segments: segs });
      }
    }
    // <br> — acts as separator only, no block pushed

    last = m.index + full.length;
  }

  // Content AFTER last block element — also through parseInline
  if (last < cleaned.length) {
    addParagraph(blocks, cleaned.slice(last));
  }

  // No block elements at all — treat whole HTML as one paragraph
  if (blocks.length === 0) {
    addParagraph(blocks, html);
  }

  return blocks;
}

function SegmentText({ seg }: { seg: Segment }) {
  // Build style array without falsy values to avoid React Native quirks
  const s: object[] = [];
  if (seg.bold) s.push(styles.bold);
  if (seg.italic) s.push(styles.italic);
  if (seg.underline) s.push(styles.underline);
  return <Text style={s.length ? s : undefined}>{seg.text}</Text>;
}

interface HtmlTextProps {
  html: string;
  style?: object;
}

export default function HtmlText({ html, style }: HtmlTextProps) {
  if (!html) return null;
  const blocks = parseBlocks(html);

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === 'bullet' || block.type === 'ordered') {
          const bullet = block.type === 'ordered' ? `${block.index}.` : '•';
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[styles.base, style, styles.bulletMarker]}>{bullet}</Text>
              <Text style={[styles.base, style, styles.listContent]}>
                {block.segments.map((seg, j) => <SegmentText key={j} seg={seg} />)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={[styles.base, style, styles.paragraph]}>
            {block.segments.map((seg, j) => <SegmentText key={j} seg={seg} />)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { color: '#4b5563', fontSize: 14, lineHeight: 22 },
  paragraph: { marginBottom: 4 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  listRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  bulletMarker: { marginRight: 8 },
  listContent: { flex: 1 },
});
