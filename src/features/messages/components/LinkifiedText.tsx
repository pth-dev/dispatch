import { splitTextWithLinks } from '../utils/message-format'

type LinkifiedTextProps = {
  text: string
  className?: string
}

export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const segments = splitTextWithLinks(text)

  return (
    <p className={className}>
      {segments.map((segment, index) =>
        segment.type === 'link' ? (
          <a
            key={`${segment.href}-${index}`}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline wrap-anywhere"
          >
            {segment.value}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </p>
  )
}
