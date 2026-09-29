import { useState, type ReactNode } from "react"

export function HoverPeek({
  src,
  alt,
  children,
}: {
  src: string
  alt: string
  children: ReactNode
}) {
  const [on, setOn] = useState(false)
  const [xy, setXy] = useState({ x: 0, y: 0 })

  return (
    <span
      className="peek"
      onMouseEnter={() => {
        if (
          window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          setOn(true)
        }
      }}
      onMouseLeave={() => setOn(false)}
      onMouseMove={(e) => setXy({ x: e.clientX, y: e.clientY })}
    >
      {children}
      {on ? (
        <span
          className="peek-shot"
          style={{ transform: `translate(${xy.x + 18}px, ${xy.y - 28}px)` }}
        >
          <img src={src} alt={alt} />
        </span>
      ) : null}
    </span>
  )
}
