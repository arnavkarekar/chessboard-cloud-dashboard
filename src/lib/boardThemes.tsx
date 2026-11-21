import { defaultPieces, type PieceRenderObject } from 'react-chessboard'
import type { BoardThemeId, PieceStyleId } from '@/types/settings'

export const BOARD_THEMES: Record<BoardThemeId, { name: string; light: string; dark: string }> = {
  emerald: { name: 'Tournament green', light: '#ebecd0', dark: '#739552' },
  walnut: { name: 'Walnut', light: '#f0d9b5', dark: '#b58863' },
  ocean: { name: 'Ocean', light: '#dee3e6', dark: '#8ca2ad' },
  slate: { name: 'Slate', light: '#e5e7eb', dark: '#7b8596' },
}

export const PIECE_STYLES: Record<PieceStyleId, string> = {
  classic: 'Classic',
  ivory: 'Ivory & ebony',
  glyph: 'Glyph (Unicode)',
}

const GLYPHS: Record<string, string> = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }

function glyphPiece(color: 'w' | 'b', type: string) {
  return function GlyphPiece(props?: { svgStyle?: React.CSSProperties }) {
    return (
      <svg viewBox="0 0 45 45" width="100%" height="100%" style={props?.svgStyle} aria-hidden="true">
        <text
          x="22.5"
          y="36"
          textAnchor="middle"
          fontSize="38"
          fontFamily="'Segoe UI Symbol','Noto Sans Symbols 2','DejaVu Sans',serif"
          fill={color === 'w' ? '#fafafa' : '#1f2937'}
          stroke={color === 'w' ? '#1f2937' : '#f8fafc'}
          strokeWidth={color === 'w' ? 1.4 : 0.6}
          paintOrder="stroke"
        >
          {GLYPHS[type]}
          {'\uFE0E'}
        </text>
      </svg>
    )
  }
}

function buildGlyphSet(): PieceRenderObject {
  const set: PieceRenderObject = {}
  for (const color of ['w', 'b'] as const) {
    for (const type of Object.keys(GLYPHS)) set[`${color}${type}`] = glyphPiece(color, type)
  }
  return set
}

function buildIvorySet(): PieceRenderObject {
  const set: PieceRenderObject = {}
  for (const [key, render] of Object.entries(defaultPieces)) {
    set[key] = (props) =>
      render({
        ...props,
        fill: key.startsWith('w') ? '#f6e7c8' : props?.fill,
        svgStyle: { ...props?.svgStyle, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' },
      })
  }
  return set
}

export const PIECE_SETS: Record<PieceStyleId, PieceRenderObject> = {
  classic: defaultPieces,
  ivory: buildIvorySet(),
  glyph: buildGlyphSet(),
}
