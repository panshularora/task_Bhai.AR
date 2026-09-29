import { useEffect, useState } from "react"
import { weatherLabel } from "../lib/apis"
import { useDay } from "../state"

const LINKS = [
  ["#am", "Morning"],
  ["#go", "Afternoon"],
  ["#five", "5pm"],
  ["#late", "Night"],
  ["#hang", "Loop"],
  ["#explore", "Find"],
  ["#twin", "Twin"],
] as const

export function Nav() {
  const { weather } = useDay()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={`nav${solid || open ? " is-solid" : ""}${open ? " is-open" : ""}`}>
      <a className="logo" href="#top" onClick={() => setOpen(false)}>
        दिल्ली <span>my delhi</span>
      </a>
      <nav className="nav-links" aria-label="Sections">
        {LINKS.map(([href, label]) => (
          <a key={href} className="nav-link" href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
      </nav>
      <div className="wx" aria-live="polite">
        {weather ? (
          <>
            <b>{weather.temp}°</b>
            <span className="hide-sm">
              {weatherLabel(weather.code)} · AQI {weather.aqi ?? "—"}
            </span>
          </>
        ) : null}
      </div>
      <button
        className="nav-toggle chip"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>
    </header>
  )
}
