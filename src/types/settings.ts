export type ThemePreference = 'light' | 'dark' | 'system'
export type BoardThemeId = 'emerald' | 'walnut' | 'ocean' | 'slate'
export type PieceStyleId = 'classic' | 'ivory' | 'glyph'
export type OrientationPreference = 'auto' | 'white' | 'black'
export type MovementSpeed = 'slow' | 'normal' | 'fast'

export interface Settings {
  theme: ThemePreference
  boardTheme: BoardThemeId
  pieceStyle: PieceStyleId
  animations: boolean

  defaultTimeControlId: string
  defaultOrientation: OrientationPreference
  highlightLegalMoves: boolean
  confirmMoves: boolean
  sound: boolean

  notifyInvitations: boolean
  notifyTurn: boolean
  notifyDeviceStatus: boolean

  boardName: string
  autoMovement: boolean
  ledHighlights: boolean
  movementSpeed: MovementSpeed
}
