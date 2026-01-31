import { useState, useRef, useEffect } from 'react'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'

export function Timeline() {
  const { t } = useI18n()
  const {
    animations,
    currentAnimationId,
    animationTime,
    isPlaying,
    addAnimation,
    setCurrentAnimation,
    setAnimationTime,
    playAnimation,
    pauseAnimation,
    stopAnimation,
  } = useEditorStore()

  const [zoom, setZoom] = useState(1)
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set())
  const timelineRef = useRef<HTMLDivElement>(null)

  const currentAnimation = animations.find((a) => a.id === currentAnimationId)
  const duration = currentAnimation?.duration || 5

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    let lastTime = performance.now()
    let animationFrame: number

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000
      lastTime = time

      const newTime = animationTime + delta
      if (newTime >= duration) {
        setAnimationTime(0)
      } else {
        setAnimationTime(newTime)
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isPlaying, animationTime, duration, setAnimationTime])

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * duration
    setAnimationTime(Math.max(0, Math.min(time, duration)))
  }

  const handleAddAnimation = () => {
    const id = addAnimation({
      name: `Animation ${animations.length + 1}`,
      duration: 5,
      tracks: [],
    })
    setCurrentAnimation(id)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const frames = Math.floor((time % 1) * 30)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  const timeMarkers = []
  for (let i = 0; i <= duration; i++) {
    timeMarkers.push(i)
  }

  return (
    <div className="flex flex-col h-full bg-ue-bg">
      {/* Header */}
      <div className="flex items-center h-8 px-3 bg-ue-bg-light border-b border-ue-border">
        <Clock size={14} className="mr-2 text-ue-text-secondary" />
        <span className="text-sm font-medium text-ue-text-primary">{t.timeline.title}</span>

        <div className="flex-1" />

        {/* Animation Selector */}
        <select
          value={currentAnimationId || ''}
          onChange={(e) => setCurrentAnimation(e.target.value || null)}
          className="px-2 py-1 mr-2 text-xs bg-ue-bg-dark border border-ue-border rounded text-ue-text-primary"
        >
          <option value="">{t.timeline.noAnimation}</option>
          {animations.map((anim) => (
            <option key={anim.id} value={anim.id}>
              {anim.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleAddAnimation}
          className="p-1 hover:bg-ue-bg-hover rounded"
          title={t.timeline.addAnimation}
        >
          <Plus size={14} className="text-ue-text-secondary" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center h-10 px-3 border-b border-ue-border gap-2">
        {/* Playback Controls */}
        <button
          onClick={() => setAnimationTime(0)}
          className="p-1.5 hover:bg-ue-bg-hover rounded"
          title={t.timeline.goToStart}
        >
          <SkipBack size={16} className="text-ue-text-secondary" />
        </button>
        <button
          onClick={() => (isPlaying ? pauseAnimation() : playAnimation())}
          className="p-1.5 hover:bg-ue-bg-hover rounded"
          title={isPlaying ? t.toolbar.pause : t.toolbar.play}
        >
          {isPlaying ? (
            <Pause size={16} className="text-ue-text-secondary" />
          ) : (
            <Play size={16} className="text-ue-text-secondary" />
          )}
        </button>
        <button
          onClick={stopAnimation}
          className="p-1.5 hover:bg-ue-bg-hover rounded"
          title={t.toolbar.stop}
        >
          <Square size={16} className="text-ue-text-secondary" />
        </button>
        <button
          onClick={() => setAnimationTime(duration)}
          className="p-1.5 hover:bg-ue-bg-hover rounded"
          title={t.timeline.goToEnd}
        >
          <SkipForward size={16} className="text-ue-text-secondary" />
        </button>

        {/* Time Display */}
        <div className="px-3 py-1 bg-ue-bg-dark rounded font-mono text-xs text-ue-text-primary">
          {formatTime(animationTime)} / {formatTime(duration)}
        </div>

        <div className="flex-1" />

        {/* Zoom */}
        <span className="text-xs text-ue-text-muted mr-2">{t.timeline.zoom}:</span>
        <input
          type="range"
          min="0.5"
          max="4"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-24 h-1 bg-ue-bg-dark rounded-lg appearance-none cursor-pointer accent-ue-accent-blue"
        />
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels */}
        <div className="w-48 flex-shrink-0 border-r border-ue-border overflow-y-auto">
          {currentAnimation?.tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center h-8 px-2 border-b border-ue-border hover:bg-ue-bg-hover"
            >
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedTracks)
                  if (newExpanded.has(track.id)) {
                    newExpanded.delete(track.id)
                  } else {
                    newExpanded.add(track.id)
                  }
                  setExpandedTracks(newExpanded)
                }}
                className="mr-1"
              >
                {expandedTracks.has(track.id) ? (
                  <ChevronDown size={12} className="text-ue-text-secondary" />
                ) : (
                  <ChevronRight size={12} className="text-ue-text-secondary" />
                )}
              </button>
              <span className="text-xs text-ue-text-primary truncate">{track.property}</span>
            </div>
          ))}

          {(!currentAnimation || currentAnimation.tracks.length === 0) && (
            <div className="flex items-center justify-center h-full text-xs text-ue-text-muted">
              {t.timeline.noTracks}
            </div>
          )}
        </div>

        {/* Timeline Tracks */}
        <div className="flex-1 overflow-auto">
          {/* Time Ruler */}
          <div className="h-6 border-b border-ue-border bg-ue-bg-light sticky top-0 z-10">
            <div
              className="h-full relative"
              style={{ width: `${duration * 100 * zoom}px` }}
            >
              {timeMarkers.map((time) => (
                <div
                  key={time}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: `${(time / duration) * 100}%` }}
                >
                  <span className="text-[10px] text-ue-text-muted">{time}s</span>
                  <div className="flex-1 w-px bg-ue-border" />
                </div>
              ))}
            </div>
          </div>

          {/* Track Rows */}
          <div
            ref={timelineRef}
            className="relative cursor-crosshair"
            style={{ width: `${duration * 100 * zoom}px`, minHeight: '100%' }}
            onClick={handleTimelineClick}
          >
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px bg-ue-accent-blue z-20"
              style={{ left: `${(animationTime / duration) * 100}%` }}
            >
              <div className="w-3 h-3 bg-ue-accent-blue -translate-x-1/2 -translate-y-1" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            </div>

            {/* Track Keyframes */}
            {currentAnimation?.tracks.map((track) => (
              <div
                key={track.id}
                className="h-8 border-b border-ue-border relative"
              >
                {track.keyframes.map((keyframe, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-ue-accent-yellow rounded-sm rotate-45 cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `${(keyframe.time / duration) * 100}%` }}
                    title={`Time: ${keyframe.time.toFixed(2)}s`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
