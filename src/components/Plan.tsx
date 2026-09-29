import { useMemo, useState } from "react"
import { METRO_STATIONS } from "../data/metro"
import { CATEGORY_META, PLACES, PRESETS } from "../data/places"
import { composeDay } from "../lib/compose"
import { DELHI, estimateTravelMin, formatMin, placeToStop } from "../lib/geo"
import { useDay } from "../state"
import { CATEGORIES } from "../types"
import type { Category } from "../types"

export function Plan() {
  const {
    itinerary,
    setItinerary,
    removeStop,
    moveStop,
    openPlace,
    route,
    userLoc,
    requestLoc,
    locLabel,
  } = useDay()
  const [moods, setMoods] = useState<Category[]>(["heritage", "food"])
  const [hours, setHours] = useState(6)
  const [startId, setStartId] = useState("rajiv-chowk")

  const start = useMemo(() => {
    if (startId === "me") return userLoc ?? DELHI
    const st = METRO_STATIONS.find((s) => s.id === startId)
    return st ? { lat: st.lat, lng: st.lng } : DELHI
  }, [startId, userLoc])

  const legs = itinerary.slice(1).map((s, i) => {
    const from = itinerary[i]
    const est = estimateTravelMin(from, s)
    return { ...est, from, to: s }
  })

  const visitMin = itinerary.reduce((n, s) => n + s.durationMin, 0)
  const travelMin = route
    ? route.durationMin
    : legs.reduce((n, l) => n + (l.mode === "walk" ? l.walkMin : l.cabMin), 0)

  function toggleMood(c: Category) {
    setMoods((m) => (m.includes(c) ? m.filter((x) => x !== c) : [...m, c]))
  }

  function compose() {
    const day = composeDay({ moods, hours, start, places: PLACES })
    setItinerary(day)
  }

  async function copyDay() {
    const lines = itinerary.map((s, i) => `${i + 1}. ${s.name}`).join("\n")
    const extra = route
      ? `\nCab route ~${route.distanceKm.toFixed(1)} km, ${Math.round(route.durationMin)} min (OSRM)`
      : ""
    const text = `Delhi day · ${hours}h intent\n${lines}${extra}\n${window.location.href}`
    await navigator.clipboard.writeText(text)
  }

  return (
    <section className="chapter" id="plan">
      <p className="chapter-kicker">A day</p>
      <h2>What I'm doing</h2>
      <p className="lede">Mood, hours, start. Or steal the loop I actually walk.</p>
      <div className="plan-grid from-right">
        <div>
          <p className="chapter-kicker">Ready-made</p>
          <div className="presets">
            {PRESETS.map((pr) => (
              <button
                key={pr.id}
                className="preset"
                onClick={() => {
                  const stops = pr.ids
                    .map((id) => PLACES.find((p) => p.id === id))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p))
                    .map(placeToStop)
                  setItinerary(stops)
                }}
              >
                <h3>{pr.name}</h3>
                <p>
                  ~{pr.hours} h · {pr.blurb}
                </p>
              </button>
            ))}
          </div>
        </div>
        <div className="composer">
          <div className="field">
            <label>Moods</label>
            <div className="moods">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`chip${moods.includes(c) ? " is-on" : ""}`}
                  onClick={() => toggleMood(c)}
                >
                  {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>
              Hours on the ground · {hours}h
            </label>
            <input
              className="hours"
              type="range"
              min={3}
              max={12}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="start">Start from</label>
            <select
              id="start"
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
            >
              <option value="me">My location ({locLabel})</option>
              {METRO_STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} Metro
                </option>
              ))}
            </select>
          </div>
          <div className="hero-cta">
            <button className="btn" onClick={compose}>
              Compose this day
            </button>
            <button className="btn ghost" onClick={requestLoc}>
              Locate me
            </button>
            <button className="btn ghost" onClick={() => setItinerary([])}>
              Clear
            </button>
            <button className="btn ghost" onClick={() => void copyDay()} disabled={!itinerary.length}>
              Copy / share
            </button>
          </div>
          <div className="totals">
            <span>{itinerary.length} stops</span>
            <span>Visit {formatMin(visitMin)}</span>
            <span>Travel {formatMin(travelMin)}</span>
            <span>Total {formatMin(visitMin + travelMin)}</span>
          </div>
          {itinerary.length === 0 ? (
            <p className="empty">Your day is empty. Compose, pick a preset, or add from any card.</p>
          ) : (
            <ol className="day-list">
              {itinerary.map((s, i) => (
                <li key={s.id}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (s.category !== "custom") openPlace(s.id)
                        }}
                      >
                        {s.name}
                      </button>
                    </h4>
                    <div className="status">
                      {s.durationMin} min on site
                      {s.metro ? ` · ${s.metro}` : ""}
                    </div>
                  </div>
                  <div className="icon-btns">
                    <button aria-label="Move up" onClick={() => moveStop(s.id, -1)}>
                      ↑
                    </button>
                    <button aria-label="Move down" onClick={() => moveStop(s.id, 1)}>
                      ↓
                    </button>
                    <button aria-label="Remove" onClick={() => removeStop(s.id)}>
                      ×
                    </button>
                  </div>
                  {legs[i] && (
                    <div className="leg">
                      {legs[i].mode === "walk"
                        ? `Walk ~${legs[i].walkMin} min`
                        : `Metro / cab ~${legs[i].cabMin} min · walk would be ${legs[i].walkMin} min`}
                      {route && i === 0 ? " · OSRM cab line on the map" : ""}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}
