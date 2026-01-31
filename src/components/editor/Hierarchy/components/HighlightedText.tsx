import { highlightSearchText } from '../utils'

interface HighlightedTextProps {
  text: string
  searchQuery: string
  className?: string
}

export function HighlightedText({ text, searchQuery, className = '' }: HighlightedTextProps) {
  const segments = highlightSearchText(text, searchQuery)

  return (
    <span className={className}>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={segment.isMatch ? 'bg-ue-accent-yellow text-black rounded px-0.5' : ''}
        >
          {segment.text}
        </span>
      ))}
    </span>
  )
}
