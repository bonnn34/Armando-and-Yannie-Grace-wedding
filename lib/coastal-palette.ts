import type { CSSProperties } from "react"

/** Coastal sunset palette — peach, dusty rose, muted teal, blue-gray, lavender-blue */
export const coastalPalette = {
  peach: "#EDB8C7",
  lavenderBlue: "#EAF3FB",
  blueGray: "#C9DFF2",
  dustyRose: "#C98198",
  teal: "#A9CBE8",
  body: "#39465A",
  title: "#39465A",
  deep: "#39465A",
  cream: "#FFF9F4",
} as const

export const displayScript: CSSProperties = {
  fontFamily: "'Brightwall', cursive",
  fontWeight: 400,
}

export const coastalLightBg = coastalPalette.lavenderBlue
export const coastalDarkBg = coastalPalette.teal

export const coastalLightGradient = coastalLightBg
export const coastalDarkGradient = coastalDarkBg

export const coastalCardShadow = `0 16px 48px color-mix(in srgb, ${coastalPalette.teal} 14%, transparent), inset 0 1px 0 rgba(255, 249, 244, 0.72)`

export const coastalTitleShadow =
  "0 2px 4px rgba(255, 249, 244, 0.85), 0 0 16px rgba(201, 223, 242, 0.45)"
