import localFont from "next/font/local"

// Keep shared fonts local so Google Fonts response changes cannot break builds.
export const inter = localFont({
  src: "../Font/Inter/Inter-Variable.ttf",
  display: "swap",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
})

export const cinzel = localFont({
  src: "../Font/Cinzel/Cinzel-Variable.ttf",
  display: "swap",
  variable: "--font-cinzel",
  weight: "400 900",
  style: "normal",
  adjustFontFallback: "Times New Roman",
})

export const playfairDisplay = localFont({
  src: [
    { path: "../Font/PlayfairDisplay/PlayfairDisplay-Variable.ttf", weight: "400 900", style: "normal" },
    { path: "../Font/PlayfairDisplay/PlayfairDisplay-Italic-Variable.ttf", weight: "400 900", style: "italic" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
})

export const playfairDisplayItalic = localFont({
  src: "../Font/PlayfairDisplay/PlayfairDisplay-Italic-Variable.ttf",
  display: "swap",
  weight: "400 900",
  style: "italic",
  adjustFontFallback: "Times New Roman",
})

export const cormorantGaramond = localFont({
  src: "../Font/CormorantGaramond/CormorantGaramond-Variable.ttf",
  display: "swap",
  weight: "300 700",
  style: "normal",
  adjustFontFallback: "Times New Roman",
})

export const greatVibes = localFont({
  src: "../Font/GreatVibes/GreatVibes-Regular.ttf",
  display: "swap",
  variable: "--font-serif",
  weight: "400",
  style: "normal",
  adjustFontFallback: "Times New Roman",
})

export const imperialScript = localFont({
  src: "../Font/ImperialScript/ImperialScript-Regular.ttf",
  display: "swap",
  variable: "--font-imperial-script",
  weight: "400",
  style: "normal",
  adjustFontFallback: "Times New Roman",
})

/**
 * Couple-name script from public/fonts/AnastasiaScript.ttf
 * (AnastasiaScript Regular.ttf is the same face).
 */
export const anastasiaScript = localFont({
  src: "../Font/AnastasiaScript.ttf",
  display: "swap",
  preload: true,
  variable: "--font-anastasia-script",
  weight: "400",
  style: "normal",
  adjustFontFallback: false,
})
