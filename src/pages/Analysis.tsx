import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Copy, Download, FileInput, FlipVertical2, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageContainer } from '@/components/layout/PageContainer'
import { ChessBoard } from '@/components/chess/ChessBoard'
import { MoveHistory } from '@/components/chess/MoveHistory'
import { EvaluationBar } from '@/components/chess/EvaluationBar'
import { SimulationBadge } from '@/components/common/SimulationBadge'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useAccount } from '@/context/AccountContext'
import { useChessGame } from '@/hooks/useChessGame'
import { COLOR_NAME, detectOutcome, mockEvaluation, TERMINATION_LABELS } from '@/lib/chess'
import { copyToClipboard, downloadTextFile } from '@/lib/utils'
import type { BoardOrientation } from '@/types/game'
import { Chess } from 'chess.js'

export default function Analysis() {
  const [params, setParams] = useSearchParams()
  const { getGame, gamesLoading } = useAccount()
  const analysis = useChessGame({ allowBranching: true })
  const [orientation, setOrientation] = useState<BoardOrientation>('white')
  const [fenInput, setFenInput] = useState('')
  const [fenError, setFenError] = useState<string | null>(null)
  const [pgnInput, setPgnInput] = useState('')
  const [pgnError, setPgnError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [source, setSource] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const gameId = params.get('game')
  const loadedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!gameId || gamesLoading || loadedRef.current === gameId) return
    loadedRef.current = gameId
    const record = getGame(gameId)
    if (record) {
      analysis.loadPgn(record.pgn)
      analysis.goTo(0)
      setOrientation(record.userColor === 'w' ? 'white' : 'black')
      setSource(`vs ${record.opponent.username}`)
      toast.success('Game loaded into analysis')
    } else toast.error('That game could not be found')
    setParams({}, { replace: true })
  }, [gameId, gamesLoading, getGame, analysis, setParams])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowLeft') analysis.stepBack()
      if (e.key === 'ArrowRight') analysis.stepForward()
      if (e.key === 'Home') analysis.goStart()
      if (e.key === 'End') analysis.goEnd()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [analysis])

  const evaluation = mockEvaluation(analysis.displayFen)
  const displayOutcome = detectOutcome(new Chess(analysis.displayFen))

  const loadFen = () => {
    const res = analysis.loadFen(fenInput)
    if (res.ok) {
      setFenError(null)
      setSource('FEN position')
      toast.success('Position loaded from FEN')
    } else setFenError(res.error)
  }

  const importPgn = (text = pgnInput) => {
    const res = analysis.loadPgn(text)
    if (res.ok) {
      setPgnError(null)
      setSource('Imported PGN')
      analysis.goTo(0)
      toast.success('PGN imported')
    } else setPgnError(res.error)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    setPgnInput(text)
    importPgn(text)
  }

  const exportPgn = () => {
    const chess = analysis.chess
    chess.setHeader('Event', 'Analysis board')
    chess.setHeader('Site', 'Smart Chessboard Dashboard (local)')
    downloadTextFile(`analysis_${new Date().toISOString().slice(0, 10)}.pgn`, analysis.pgn())
    toast.success('PGN downloaded')
  }

  const copyFen = async () => {
    if (await copyToClipboard(analysis.displayFen)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <PageContainer
      title="Analysis board"
      description={source ? `Exploring: ${source}` : 'Explore positions, import games, and step through moves.'}
      actions={
        <>
          <Button variant="outline" onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}>
            <FlipVertical2 /> Flip
          </Button>
          <Button variant="outline" onClick={exportPgn} disabled={analysis.history.length === 0}>
            <Download /> Export PGN
          </Button>
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            <RotateCcw /> Reset
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="mx-auto w-full max-w-[min(100%,max(18rem,calc(100dvh-19rem)))]">
          <div className="flex gap-2 sm:gap-3">
            <EvaluationBar fen={analysis.displayFen} orientation={orientation} />
            <div className="min-w-0 flex-1">
              <ChessBoard
                id="analysis-board"
                fen={analysis.displayFen}
                orientation={orientation}
                movable={displayOutcome ? 'none' : 'both'}
                onMove={(m) => !!analysis.makeMove(m)}
                lastMove={analysis.lastMove}
                checkSquare={analysis.checkSquare}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {displayOutcome ? TERMINATION_LABELS[displayOutcome.reason] : `${COLOR_NAME[analysis.displayTurn]} to move`}
            </span>
            {analysis.isViewingHistory && (
              <span className="text-xs text-muted-foreground">Moving from here replaces the later moves.</span>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle>Evaluation</CardTitle>
              <SimulationBadge label="Mock" tip="Material count plus a tiny mobility term. Not an engine calculation." />
            </CardHeader>
            <CardContent>
              <p className="tabular text-3xl font-semibold">{evaluation.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Mock heuristic based on material balance — not a real engine evaluation. Stockfish integration is planned for a later phase.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="moves">
                <TabsList className="w-full">
                  <TabsTrigger value="moves">Moves</TabsTrigger>
                  <TabsTrigger value="fen">FEN</TabsTrigger>
                  <TabsTrigger value="pgn">Import PGN</TabsTrigger>
                </TabsList>
                <TabsContent value="moves">
                  <MoveHistory history={analysis.history} displayedPly={analysis.displayedPly} onSelect={analysis.goTo} className="h-72" emptyLabel="Make a move on the board to begin" />
                </TabsContent>
                <TabsContent value="fen" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current FEN</Label>
                    <div className="flex gap-2">
                      <code className="min-w-0 flex-1 break-all rounded-md border bg-muted/50 px-2.5 py-2 font-mono text-xs">{analysis.displayFen}</code>
                      <Button variant="outline" size="icon" onClick={copyFen} aria-label="Copy FEN">
                        {copied ? <Check /> : <Copy />}
                      </Button>
                    </div>
                  </div>
                  <form
                    className="space-y-1.5"
                    onSubmit={(e) => {
                      e.preventDefault()
                      loadFen()
                    }}
                  >
                    <Label htmlFor="fen-input">Load position from FEN</Label>
                    <Input
                      id="fen-input"
                      value={fenInput}
                      onChange={(e) => {
                        setFenInput(e.target.value)
                        setFenError(null)
                      }}
                      placeholder="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
                      className="font-mono text-xs"
                      aria-invalid={!!fenError}
                    />
                    {fenError && <p className="text-xs text-destructive">{fenError}</p>}
                    <Button type="submit" size="sm" disabled={!fenInput.trim()}>
                      <FileInput /> Load FEN
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="pgn" className="space-y-2">
                  <Label htmlFor="pgn-input">Paste PGN</Label>
                  <Textarea
                    id="pgn-input"
                    value={pgnInput}
                    onChange={(e) => {
                      setPgnInput(e.target.value)
                      setPgnError(null)
                    }}
                    rows={8}
                    placeholder={'[Event "Casual"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 *'}
                    className="font-mono text-xs"
                    aria-invalid={!!pgnError}
                  />
                  {pgnError && <p className="text-xs text-destructive">{pgnError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => importPgn()} disabled={!pgnInput.trim()}>
                      <FileInput /> Import
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                      <Upload /> From file
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pgn,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        onFile(e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline">← →</Badge> step
            <Badge variant="outline">Home / End</Badge> jump
          </div>
        </aside>
      </div>

      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the analysis board?"
        description="All moves and the loaded position will be cleared."
        confirmLabel="Reset board"
        destructive
        onConfirm={() => {
          analysis.reset()
          setSource(null)
        }}
      />
    </PageContainer>
  )
}
