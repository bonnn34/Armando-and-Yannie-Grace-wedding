"use client"

import React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import localFont from "next/font/local"
import { Section } from "@/components/section"
import { sectionType } from "@/lib/section-typography"
import { cinzel } from "@/lib/fonts"
import { useSiteConfig } from "@/hooks/use-site-config"
import { fetchUntilReady, isAbortError } from "@/lib/fetch-until-ready"
import { fetchInvitationList } from "@/lib/invitation-data"
import { PlainBubbles } from "@/components/loader/PlainBubbles"
import { SectionBackdrop } from "@/components/section-backdrop"

const theSeasons = localFont({
  src: "../../Font/Fontspring-DEMO-theseasons-reg.otf",
  display: "swap",
  variable: "--font-the-seasons",
})

const aboveTheBeyond = localFont({
  src: "../../Font/above-the-beyond-script.otf",
  display: "swap",
  variable: "--font-above-beyond",
})

// Palette lives in globals.css → motif / welcome tokens.
const PAPER = "var(--color-welcome-bg-soft)"
const ACCENT = "var(--color-welcome-heading)"
const NAVY = "var(--color-ink-deep)"
const SCRIPT = "var(--color-ink-accent)"
const BODY = "var(--color-welcome-text)"
const HAIRLINE = "color-mix(in srgb, var(--color-motif-medium) 60%, transparent)"

const sectionBg = "var(--color-bg-pattern-base)"

const onBg = {
  color: "var(--color-ink-deep)",
  textShadow:
    "0 0 1px var(--color-on-pattern-glow), 0 1px 0 var(--color-on-pattern-glow), 0 0 14px var(--color-on-pattern-glow), 0 0 26px var(--color-on-pattern-glow)",
} as const

const onBgLineStyle = {
  background: "var(--color-ink-accent)",
} as const

const dividerLineStyle = {
  background: "linear-gradient(to right, transparent, var(--color-motif-medium), transparent)",
} as const

const cardStyle = {
  background: PAPER,
  boxShadow:
    "0 26px 56px -30px color-mix(in srgb, var(--color-welcome-navy) 55%, transparent), inset 0 1px 0 rgb(255 249 244 / 80%)",
} as const

const palette = {
  body: BODY,
  heading: NAVY,
  label: ACCENT,
  accent: ACCENT,
} as const

function OutsideDivider() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="h-px w-10 sm:w-16" style={{ background: "var(--color-ink-accent)" }} />
      <span className="h-1.5 w-1.5 rotate-45" style={{ background: "var(--color-ink-accent)" }} aria-hidden />
      <span className="h-px w-10 sm:w-16" style={{ background: "var(--color-ink-accent)" }} />
    </div>
  )
}

const SECTION_TITLE_CLASS = `${cinzel.className} font-semibold text-[0.6875rem] sm:text-[0.8rem] md:text-[0.9rem] tracking-[0.14em] sm:tracking-[0.16em] md:tracking-[0.18em] uppercase leading-tight`

const NAME_FONT = '"Cormorant Garamond", "SortsMillGoudy", Georgia, serif'

const nameStyle: React.CSSProperties = {
  fontFamily: NAME_FONT,
  fontWeight: 600,
  fontSize: "clamp(0.875rem, min(3.7vw, 4.4cqi), 1.12rem)",
  lineHeight: 1.2,
  letterSpacing: "0.01em",
}

// Slightly reduced clamp size so long names fit on one line
const featuredNameSize = "clamp(0.75rem, min(3.4vw, 4.4cqi), 1.15rem)"
const noWrapNameSize = "clamp(0.75rem, min(3.2vw, 4.2cqi), 1.05rem)"

const roleTitleStyle: React.CSSProperties = {
  fontSize: "clamp(0.5625rem, min(2.4vw, 2.9cqi), 0.68rem)",
  lineHeight: 1.25,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
}

const ROMAN_NUMERAL = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)$/i
const SPECIAL_GLYPH = /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|&|\+|[.’'`´-]|—|–)$/i
const SPECIAL_SPLIT = /(\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)\b|&|\+|[.’'`´-]|—|–)/g
const DASH_GLYPH = /^[-—–]$/
const PLUS_GLYPH = /^\+$/

function toDisplayName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .map((part) => {
          if (!part) return part
          if (ROMAN_NUMERAL.test(part)) return part.toUpperCase()
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        })
        .join("-"),
    )
    .join(" ")
}

function MixedFontText({
  text,
  specialClassName,
}: {
  text: string
  specialClassName: string
}) {
  const parts = text.split(new RegExp(SPECIAL_SPLIT.source, "g"))
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null
        if (DASH_GLYPH.test(part)) {
          return (
            <span
              key={`${part}-${index}`}
              className="font-normal not-italic tracking-normal"
              style={{ fontFamily: '"SortsMillGoudy", Georgia, "Times New Roman", serif' }}
            >
              {part}
            </span>
          )
        }
        if (PLUS_GLYPH.test(part)) {
          return (
            <span
              key={`${part}-${index}`}
              className="relative -top-[0.08em] mx-[0.1em] inline-block font-normal not-italic tracking-normal"
              style={{
                fontFamily: '"SortsMillGoudy", Georgia, "Times New Roman", serif',
                fontSize: "0.95em",
              }}
              aria-label="of blessed memory"
            >
              †
            </span>
          )
        }
        if (SPECIAL_GLYPH.test(part)) {
          return (
            <span key={`${part}-${index}`} className={specialClassName}>
              {part}
            </span>
          )
        }
        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      })}
    </>
  )
}

function CouplePromiseMark({ kicker, line }: { kicker: string; line: string }) {
  return (
    <div className="-mt-2 mb-3 text-center sm:-mt-4 sm:mb-5 md:-mt-5 md:mb-6">
      <p
        className={`${cinzel.className} text-[0.62rem] font-semibold uppercase tracking-[0.18em] sm:text-[0.6875rem] sm:tracking-[0.24em] md:tracking-[0.28em]`}
        style={{ color: ACCENT }}
      >
        {kicker}
      </p>
      <p
        className={`font-goudy-italic mx-auto mt-1.5 max-w-[16rem] text-[0.76rem] sm:text-sm sm:mt-2`}
        style={{ color: BODY }}
      >
        {line}
      </p>
    </div>
  )
}

function EntourageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <h2
      className="welcome-title-lockup relative mx-auto w-full max-w-full text-center"
      style={
        {
          "--title-size": "clamp(1.25rem, min(5.8vw, 8cqi), 3rem)",
          "--script-size": "clamp(0.78rem, min(3.2vw, 4.8cqi), 1.85rem)",
        } as React.CSSProperties
      }
    >
      <span className="sr-only">{title} — {subtitle}</span>
      <span
        aria-hidden
        className={`${theSeasons.className} block uppercase leading-[0.9] tracking-[0.04em] min-[400px]:tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.14em]`}
        style={{
          fontSize: "var(--title-size)",
          ...onBg,
        }}
      >
        {title}
      </span>
      <span
        aria-hidden
        className={`${aboveTheBeyond.className} relative z-10 mx-auto mt-1.5 block w-fit max-w-full px-1 leading-[0.88] sm:mt-2 sm:leading-[0.9]`}
        style={{
          fontSize: "var(--script-size)",
          ...onBg,
        }}
      >
        {subtitle}
      </span>
    </h2>
  )
}

interface EntourageMember {
  name: string
  roleCategory: string
  roleTitle: string
  email: string
}

interface PrincipalSponsor {
  malePrincipalSponsor: string
  femalePrincipalSponsor: string
}

function entourageMemberFromApi(row: Record<string, unknown>): EntourageMember {
  const r = row as Record<string, string | undefined>
  return {
    name: r.name ?? r.Name ?? "",
    roleCategory: r.roleCategory ?? r.RoleCategory ?? "",
    roleTitle: r.roleTitle ?? r.RoleTitle ?? "",
    email: r.email ?? r.Email ?? "",
  }
}

function firstSheetText(row: Record<string, string | undefined>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]?.trim()
    if (value) return value
  }
  return ""
}

function principalSponsorFromApi(row: Record<string, unknown>): PrincipalSponsor {
  const r = row as Record<string, string | undefined>
  return {
    malePrincipalSponsor: firstSheetText(r, [
      "malePrincipalSponsor",
      "MalePrincipalSponsor",
      "Male",
      "Ninong",
      "ninong",
    ]),
    femalePrincipalSponsor: firstSheetText(r, [
      "femalePrincipalSponsor",
      "FemalePrincipalSponsor",
      "Female",
      "Ninang",
      "ninang",
    ]),
  }
}

const ct = {
  label: sectionType.label,
  sectionTitle: `${sectionType.label} lg:text-base`,
  body: sectionType.text,
  bodyLg: sectionType.subheader,
} as const

const ROLE_CATEGORY_ORDER = [
  "Principal Sponsors",
  "Peer Sponsors",
  "Family of the Groom",
  "Family of the Bride",
  "Man of Honor",
  "Matron of Honor",
  "Best Man",
  "Maid of Honor",
  "Little Groom",
  "Little Bride",
  "Little Tiny Groom",
  "Little Love Bearer",
  "Little Promise Bearer",
  "Candle Sponsors",
  "Candle Bearer",
  "Veil Sponsors",
  "Cord Sponsors",
  "Ribbon Sponsors",
  "Groomsmen",
  "Bridesmaids",
  "Bridesmen",
  "Ring Bearer",
  "Coin Bearer",
  "Bible Bearer",
  "Flower Ladies",
  "Escorts",
  "Petal Maidens",
  "Little Groomsmen",
  "Little Bridesmaids",
]

const BEARER_BLOCK_CATEGORIES = ["Ring Bearer", "Coin Bearer", "Bible Bearer"] as const

const PAIRED_COLUMN_SECTIONS: { key: string; left: string; right: string }[] = [
  { key: "LittleGroomsmenBridesmaids", left: "Little Groomsmen", right: "Little Bridesmaids" },
]

const TWO_COLUMN_SECONDARY_GROUPS = new Set([
  "Little Love Bearer",
  "Candle Bearer",
  "Candle Sponsors",
  "Veil Sponsors",
  "Cord Sponsors",
  "Ribbon Sponsors",
])

const SINGLE_COLUMN_SECTIONS = new Set([
  "Best Man",
  "Maid of Honor",
  "Ring Bearer",
  "Coin Bearer",
  "Bible Bearer",
  "Flower Girls",
  "Presider",
])

function displayRoleCategory(category: string, members: EntourageMember[] = []) {
  return members[0]?.roleCategory?.trim() || category
}

const HONOR_ATTENDANT_BLOCK_CATEGORIES = [
  "Man of Honor",
  "Matron of Honor",
  "Best Man",
  "Maid of Honor",
] as const

function normalizeRoleCategory(category: string): string {
  const normalized = category.trim()
  const lower = normalized.toLowerCase()

  if (lower.includes("groom") && (lower.includes("parent") || lower.includes("mother") || lower.includes("father"))) {
    return "Parents of the Groom"
  }
  if (lower.includes("bride") && (lower.includes("parent") || lower.includes("mother") || lower.includes("father"))) {
    return "Parents of the Bride"
  }
  if (lower.includes("officiat") || lower.includes("minister") || lower.includes("pastor")) {
    return "OFFICIATING MINISTER"
  }
  
  if (lower === "principal sponsors" || lower === "ninong" || lower === "ninang" || lower === "ninong/ninang" || lower.includes("principal sponsor")) {
    return "Principal Sponsors"
  }
  if (lower === "peer sponsors" || lower.includes("peer sponsor")) {
    return "Peer Sponsors"
  }
  if (
    lower === "flower ladies" ||
    lower === "flower girls" ||
    lower.includes("flower girl")
  ) {
    return "Flower Ladies"
  }
  if (/^man of honor$/i.test(normalized)) return "Man of Honor"
  if (/^matron of honor$/i.test(normalized)) return "Matron of Honor"
  if (/^maid of honor$/i.test(normalized)) return "Maid of Honor"
  if (/^best man$/i.test(normalized)) return "Best Man"
  if (/^little love bearers?$/i.test(normalized)) return "Little Love Bearer"
  if (/^candle bearers?$/i.test(normalized)) return "Candle Bearer"
  if (/^candle sponsors?$/i.test(normalized)) return "Candle Sponsors"
  if (/^ribbon sponsors?$/i.test(normalized)) return "Ribbon Sponsors"
  if (/^ch?ord sponsors?$/i.test(normalized)) return "Cord Sponsors"
  if (/^(cloth|veil) sponsors?$/i.test(normalized)) return "Veil Sponsors"
  if (/^bridesm(a|e)n$/i.test(normalized)) return "Bridesmen"
  if (/^escorts?$/i.test(normalized)) return "Escorts"
  if (/^petal maidens?$/i.test(normalized)) return "Petal Maidens"
  
  return normalized
}

function isCoupleMember(member: EntourageMember): boolean {
  return normalizeRoleCategory(member.roleCategory) === "The Couple"
}

function sortGroomParents(members: EntourageMember[]): EntourageMember[] {
  return [...members].sort((a, b) => {
    const aIsFather = a.roleTitle?.toLowerCase().includes("father") ?? false
    const bIsFather = b.roleTitle?.toLowerCase().includes("father") ?? false
    if (aIsFather && !bIsFather) return -1
    if (!aIsFather && bIsFather) return 1
    return 0
  })
}

function sortBrideParents(members: EntourageMember[]): EntourageMember[] {
  return [...members].sort((a, b) => {
    const aIsMother = a.roleTitle?.toLowerCase().includes("mother") ?? false
    const bIsMother = b.roleTitle?.toLowerCase().includes("mother") ?? false
    if (aIsMother && !bIsMother) return -1
    if (!aIsMother && bIsMother) return 1
    return 0
  })
}

function toEntourageMembers(data: Record<string, unknown>[]): EntourageMember[] {
  return data
    .map((row) => entourageMemberFromApi(row))
    .filter((member) => member.name.trim())
    .filter((member) => !isCoupleMember(member))
}

function toPrincipalSponsors(data: Record<string, unknown>[]): PrincipalSponsor[] {
  return data
    .map((row) => principalSponsorFromApi(row))
    .filter((sponsor) => sponsor.malePrincipalSponsor.trim() || sponsor.femalePrincipalSponsor.trim())
}

async function loadEntourageFromApi(signal?: AbortSignal, reload = false): Promise<EntourageMember[]> {
  const data = await fetchInvitationList<Record<string, unknown>>("/api/entourage", { signal, reload })
  return toEntourageMembers(data)
}

export type SponsorsList = "one" | "two"

function sponsorsUrl(list?: SponsorsList) {
  return list ? `/api/principal-sponsor?list=${list}` : "/api/principal-sponsor"
}

async function loadSponsorsFromApi(url: string, signal?: AbortSignal, reload = false): Promise<PrincipalSponsor[]> {
  try {
    const data = await fetchInvitationList<Record<string, unknown>>(url, { signal, reload })
    return toPrincipalSponsors(data)
  } catch (error) {
    if (isAbortError(error)) throw error
    console.warn("Failed to load principal sponsors:", error)
    return []
  }
}

export function Entourage({ sponsorsList }: { sponsorsList?: SponsorsList } = {}) {
  const sponsorsPath = sponsorsUrl(sponsorsList)
  const siteConfig = useSiteConfig()
  const content = siteConfig.entourage
  const groomName = siteConfig.couple.groom
  const brideName = siteConfig.couple.bride
  const [entourage, setEntourage] = useState<EntourageMember[]>([])
  const [sponsors, setSponsors] = useState<PrincipalSponsor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const loadParty = async (signal?: AbortSignal, { reload = false } = {}) => {
    setIsLoading(true)
    setIsRetrying(false)
    setError(null)

    try {
      const [members, sponsorList] = await Promise.all([
        fetchUntilReady({
          signal,
          load: (s) => loadEntourageFromApi(s, reload),
          isReady: (list) => list.length > 0,
          maxAttempts: 4,
          maxDelayMs: 3000,
          onRetry: () => setIsRetrying(true),
        }).catch((entourageError) => {
          if (isAbortError(entourageError)) throw entourageError
          console.warn("Failed to load entourage members:", entourageError)
          return [] as EntourageMember[]
        }),
        loadSponsorsFromApi(sponsorsPath, signal, reload),
      ])
      if (signal?.aborted) return
      setEntourage(members)
      setSponsors(sponsorList)
      setError(null)
    } catch (err: unknown) {
      if (isAbortError(err)) return
      console.error("Failed to load entourage:", err)
      setError("Unable to load entourage")
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
        setIsRetrying(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadParty(controller.signal)

    let updateTimer: ReturnType<typeof setTimeout> | undefined
    const handleEntourageUpdate = () => {
      clearTimeout(updateTimer)
      updateTimer = setTimeout(() => {
        void loadParty(controller.signal, { reload: true })
      }, 1000)
    }

    window.addEventListener("entourageUpdated", handleEntourageUpdate)

    return () => {
      controller.abort()
      clearTimeout(updateTimer)
      window.removeEventListener("entourageUpdated", handleEntourageUpdate)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const grouped = useMemo(() => {
    const grouped: Record<string, EntourageMember[]> = {}
    entourage.forEach((member) => {
      const category = normalizeRoleCategory(member.roleCategory)
      if (!category || category === "Other") return
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(member)
    })
    return grouped
  }, [entourage])

  const parentsBride = grouped["Parents of the Bride"] || []
  const parentsGroom = grouped["Parents of the Groom"] || []
  const hasGroomParents = parentsGroom.length > 0
  const hasBrideParents = parentsBride.length > 0
  const hasParents = hasGroomParents || hasBrideParents
  const officiating = grouped["OFFICIATING MINISTER"] || []

  const SectionTitle = ({
    children,
    align = "center",
    className = "",
  }: {
    children: React.ReactNode
    align?: "left" | "center" | "right"
    className?: string
  }) => {
    const textAlign = align === "right" ? "text-right" : align === "left" ? "text-left" : "text-center"
    return (
      <h3
        className={`relative ${SECTION_TITLE_CLASS} mb-1 sm:mb-2 md:mb-2.5 ${textAlign} ${className} transition-all duration-300`}
        style={{ color: NAVY }}
      >
        {typeof children === "string" ? content.headingLabels[children] ?? children : children}
      </h3>
    )
  }

  const SectionCaption = ({ children }: { children: React.ReactNode }) => (
    <p
      className="font-goudy-italic mx-auto -mt-0.5 mb-2 max-w-md px-4 text-center text-[0.8125rem] leading-snug sm:mb-3 sm:text-sm md:text-[0.95rem]"
      style={{ color: SCRIPT }}
    >
      {children}
    </p>
  )

  const NameItem = ({
    member,
    align = "center",
    showRole = true,
    featured = false,
    noWrap = false,
  }: {
    member: EntourageMember
    align?: "left" | "center" | "right"
    showRole?: boolean
    featured?: boolean
    noWrap?: boolean
  }) => {
    const containerAlign = align === "right" ? "items-end" : align === "left" ? "items-start" : "items-center"
    const textAlign = align === "right" ? "text-right" : align === "left" ? "text-left" : "text-center"
    const displayName = toDisplayName(member.name)
    const displayRole = member.roleTitle ? toDisplayName(member.roleTitle) : ""
    return (
      <div className={`relative flex flex-col ${containerAlign} justify-center py-0.5 sm:py-1.5 min-w-0 w-full max-w-full group/item transition-all duration-300`}>
        <div className="absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-md" style={{ background: "linear-gradient(to right, transparent, color-mix(in srgb, var(--color-motif-silver) 70%, transparent), transparent)" }} />
        <p
          className={`relative ${textAlign} transition-all duration-300 max-w-full ${featured || noWrap ? "whitespace-nowrap" : "break-words"}`}
          style={{
            ...nameStyle,
            ...(featured ? { fontSize: featuredNameSize } : {}),
            ...(noWrap && !featured ? { fontSize: noWrapNameSize } : {}),
            color: NAVY,
          }}
          title={displayName.replace(/\+/g, "†")}
        >
          {displayName ? <MixedFontText text={displayName} specialClassName="tracking-normal" /> : null}
        </p>
        {showRole && displayRole && (
          <p className={`${cinzel.className} relative mt-0.5 font-semibold ${textAlign} max-w-full break-words`} style={{ ...roleTitleStyle, color: SCRIPT }} title={displayRole}>
            <MixedFontText text={displayRole} specialClassName="tracking-normal" />
          </p>
        )}
      </div>
    )
  }

  const renderPairRows = (keyPrefix: string, left: EntourageMember[], right: EntourageMember[]) => {
    const maxLen = Math.max(left.length, right.length)
    const rows = []
    for (let i = 0; i < maxLen; i++) {
      const l = left[i]
      const r = right[i]
      rows.push(
        <React.Fragment key={`${keyPrefix}-row-${i}`}>
          <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">{l ? <NameItem member={l} align="right" /> : <div className="py-0.5" />}</div>
          <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">{r ? <NameItem member={r} align="left" /> : <div className="py-0.5" />}</div>
        </React.Fragment>
      )
    }
    return rows
  }

  const TwoColumnLayout = ({
    children,
    leftTitle,
    rightTitle,
    singleTitle,
    caption,
    centerContent = false,
  }: {
    children: React.ReactNode
    leftTitle?: string
    rightTitle?: string
    singleTitle?: string
    caption?: string
    centerContent?: boolean
  }) => {
    if (singleTitle) {
      return (
        <div className="mb-1.5 sm:mb-2.5 md:mb-3">
          <SectionTitle>{singleTitle}</SectionTitle>
          {caption && <SectionCaption>{caption}</SectionCaption>}
          <div className={`grid grid-cols-2 gap-x-1.5 sm:gap-x-3 md:gap-x-5 gap-y-1 sm:gap-y-1.5 ${centerContent ? "max-w-3xl mx-auto" : ""}`}>{children}</div>
        </div>
      )
    }

    return (
      <div className="mb-1.5 sm:mb-2.5 md:mb-3">
        <div className="grid grid-cols-2 gap-x-1.5 sm:gap-x-3 md:gap-x-5 mb-2 sm:mb-2.5 md:mb-3">
          {leftTitle && <SectionTitle align="right" className="pr-0.5 sm:pr-1">{leftTitle}</SectionTitle>}
          {rightTitle && <SectionTitle align="left" className="pl-0.5 sm:pl-1">{rightTitle}</SectionTitle>}
        </div>
        <div className={`grid grid-cols-2 gap-x-1.5 sm:gap-x-3 md:gap-x-5 gap-y-1 sm:gap-y-1.5 ${centerContent ? "max-w-3xl mx-auto" : ""}`}>{children}</div>
      </div>
    )
  }

  return (
    <div ref={sectionRef} className={`${theSeasons.variable} ${aboveTheBeyond.variable} relative w-full overflow-hidden`} style={{ background: sectionBg }}>
      <PlainBubbles />
      <SectionBackdrop />
      <Section id="entourage" className="relative z-10 overflow-hidden pt-14 pb-12 sm:pt-16 sm:pb-14 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
      <div className={`relative z-20 mx-auto mb-5 max-w-5xl px-3 text-center @container/entourage sm:mb-10 sm:px-4 md:mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}>
        <div className="mx-auto mb-2.5 sm:mb-5 md:mb-6">
          <OutsideDivider />
        </div>
        <p className={`${cinzel.className} mx-auto max-w-[20rem] px-2 text-[0.6875rem] font-semibold leading-snug tracking-[0.12em] min-[400px]:max-w-none min-[400px]:text-[0.75rem] min-[400px]:tracking-[0.16em] sm:text-[0.8125rem] sm:tracking-[0.2em] md:text-sm md:tracking-[0.22em]`} style={onBg}>
          {content.eyebrow}
        </p>
        <div className="mx-auto mt-2 sm:mt-4 md:mt-5">
          <EntourageTitle title={content.title} subtitle={content.subtitle} />
        </div>
        <p className="font-goudy-italic mx-auto mt-2.5 max-w-xl px-2 text-[0.78rem] leading-snug sm:mt-5 sm:text-base sm:leading-relaxed md:mt-6" style={{ ...onBg, fontWeight: 600 }}>
          {content.description}
        </p>
        <div className="mt-3 flex items-center justify-center sm:mt-5">
          <span className="h-px w-16 sm:w-24 md:w-32" style={onBgLineStyle} />
        </div>
      </div>

      <div className={`relative z-20 mx-auto max-w-3xl px-2.5 pb-1 sm:max-w-4xl sm:px-6 md:px-8 @container/entourage-card transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <div className="relative">
          <div className="relative z-20 overflow-hidden rounded-t-full" style={cardStyle}>
            <div className="pointer-events-none absolute inset-2 z-30 rounded-t-full sm:inset-4 md:inset-5" style={{ border: `1px solid ${HAIRLINE}` }} aria-hidden />
            <div className="relative z-20 px-3 pb-7 pt-[18%] sm:px-8 sm:pt-[22%] sm:pb-12 md:px-12 md:pb-14 lg:px-14">
            {isLoading || error || (entourage.length === 0 && sponsors.length === 0) ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 sm:py-28 md:py-32">
                <p className={`font-goudy-italic ${ct.body} text-center`} style={{ color: palette.body }}>
                  {!isLoading ? content.errorText : isRetrying ? content.retryingText : content.loadingText}
                </p>
                {!isLoading && (
                  <button
                    type="button"
                    onClick={() => void loadParty(undefined, { reload: true })}
                    className={`${cinzel.className} rounded-full px-6 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] transition-transform duration-300 hover:-translate-y-0.5`}
                    style={{ background: "var(--color-welcome-navy)", color: "var(--color-welcome-bg)" }}
                  >
                    {content.retryText}
                  </button>
                )}
              </div>
            ) : (
            <>
              <CouplePromiseMark kicker={content.coupleKicker} line={content.coupleLine} />
              
              {/* 1. THE COUPLE */}
              <div className="mb-1.5 sm:mb-2.5 md:mb-3">
                <SectionTitle>{content.coupleHeading}</SectionTitle>
                <div className="flex flex-row justify-between items-start gap-2 sm:gap-4 w-full px-1 sm:px-4">
                  <div className="flex-1 flex justify-end min-w-0">
                    <NameItem member={{ name: groomName, roleCategory: "The Couple", roleTitle: content.groomRole, email: "" }} align="right" featured />
                  </div>
                  <div className="flex-1 flex justify-start min-w-0">
                    <NameItem member={{ name: brideName, roleCategory: "The Couple", roleTitle: content.brideRole, email: "" }} align="left" featured />
                  </div>
                </div>
              </div>

              {/* 2. PARENTS OF THE GROOM & BRIDE */}
              {hasParents && (
                <div key="Parents">
                  <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                    <div className="w-full max-w-md h-px" style={dividerLineStyle} />
                  </div>
                  <SectionCaption>With the blessings of our parents</SectionCaption>
                  {hasGroomParents && hasBrideParents && (
                    <TwoColumnLayout leftTitle="Parents of the Groom" rightTitle="Parents of the Bride">
                      {(() => {
                        const leftArr = sortGroomParents(parentsGroom)
                        const rightArr = sortBrideParents(parentsBride)
                        const maxLen = Math.max(leftArr.length, rightArr.length)
                        const rows = []
                        for (let i = 0; i < maxLen; i++) {
                          const left = leftArr[i]
                          const right = rightArr[i]
                          rows.push(
                            <React.Fragment key={`parents-row-${i}`}>
                              <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                {left ? <NameItem member={left} align="right" showRole={false} noWrap /> : <div className="py-0.5" />}
                              </div>
                              <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                {right ? <NameItem member={right} align="left" showRole={false} noWrap /> : <div className="py-0.5" />}
                              </div>
                            </React.Fragment>
                          )
                        }
                        return rows
                      })()}
                    </TwoColumnLayout>
                  )}
                  {hasGroomParents && !hasBrideParents && (
                    <TwoColumnLayout singleTitle="Parents of the Groom" centerContent={true}>
                      {sortGroomParents(parentsGroom).map((member, idx) => (
                        <div key={`parent-groom-only-${idx}-${member.name}`} className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1">
                          <NameItem member={member} align="center" showRole={false} noWrap />
                        </div>
                      ))}
                    </TwoColumnLayout>
                  )}
                  {!hasGroomParents && hasBrideParents && (
                    <TwoColumnLayout singleTitle="Parents of the Bride" centerContent={true}>
                      {sortBrideParents(parentsBride).map((member, idx) => (
                        <div key={`parent-bride-only-${idx}-${member.name}`} className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1">
                          <NameItem member={member} align="center" showRole={false} noWrap />
                        </div>
                      ))}
                    </TwoColumnLayout>
                  )}
                </div>
              )}

              {/* 3. OFFICIATING MINISTER */}
              {officiating.length > 0 && (
                <div key="OfficiatingMinister" className="mt-3 sm:mt-5 md:mt-6">
                  <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                    <div className="w-full max-w-md h-px" style={dividerLineStyle} />
                  </div>
                  <TwoColumnLayout
                    singleTitle="OFFICIATING MINISTER"
                    caption="To solemnize the marriage and lead the couple in their covenant before God."
                    centerContent={true}
                  >
                    {officiating.map((member, idx) => (
                      <div key={`officiating-${idx}-${member.name}`} className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1">
                        <NameItem member={member} align="center" showRole={false} noWrap />
                      </div>
                    ))}
                  </TwoColumnLayout>
                </div>
              )}

              {/* 4. THE REST OF THE ENTOURAGE */}
              {(() => {
                let renderedAny = hasParents || officiating.length > 0;

                return (
                  <>
                    {ROLE_CATEGORY_ORDER.map((category) => {
                      const members = grouped[category] || []
                      const divider = renderedAny ? (
                        <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                          <div className="w-full max-w-md h-px" style={dividerLineStyle} />
                        </div>
                      ) : null

                      if (category === "Principal Sponsors") {
                        if (sponsors.length === 0) return null
                        renderedAny = true
                        return (
                          <div key="PrincipalSponsors">
                            {divider}
                            <TwoColumnLayout singleTitle="Principal Sponsors" caption="To stand as principal witnesses in our exchange of vows" centerContent={true}>
                              {sponsors.map((sponsor, idx) => (
                                <React.Fragment key={`sponsor-row-${idx}`}>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {sponsor.malePrincipalSponsor ? (
                                      <NameItem member={{ name: sponsor.malePrincipalSponsor, roleCategory: "", roleTitle: "", email: "" }} align="right" showRole={false} noWrap />
                                    ) : (
                                      <div className="py-0.5 sm:py-1 md:py-1.5" />
                                    )}
                                  </div>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    {sponsor.femalePrincipalSponsor ? (
                                      <NameItem member={{ name: sponsor.femalePrincipalSponsor, roleCategory: "", roleTitle: "", email: "" }} align="left" showRole={false} noWrap />
                                    ) : (
                                      <div className="py-0.5 sm:py-1 md:py-1.5" />
                                    )}
                                  </div>
                                </React.Fragment>
                              ))}
                            </TwoColumnLayout>
                          </div>
                        )
                      }

                      if (category === "Peer Sponsors") {
                        if (members.length === 0) return null
                        renderedAny = true
                        return (
                          <div key="PeerSponsors">
                            {divider}
                            <TwoColumnLayout singleTitle="Peer Sponsors" centerContent={true}>
                              {members.length === 2 ? (
                                <>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    <NameItem member={members[0]} align="right" showRole={false} noWrap />
                                  </div>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    <NameItem member={members[1]} align="left" showRole={false} noWrap />
                                  </div>
                                </>
                              ) : members.length <= 2 ? (
                                <div className="col-span-full">
                                  <div className="max-w-sm mx-auto flex flex-col items-center gap-0.5 sm:gap-1 md:gap-1">
                                    {members.map((member, idx) => (
                                      <NameItem key={`peer-sponsor-${idx}-${member.name}`} member={member} align="center" showRole={false} noWrap />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                (() => {
                                  const half = Math.ceil(members.length / 2)
                                  const left = members.slice(0, half)
                                  const right = members.slice(half)
                                  const maxLen = Math.max(left.length, right.length)
                                  const rows = []
                                  for (let i = 0; i < maxLen; i++) {
                                    const l = left[i]
                                    const r = right[i]
                                    rows.push(
                                      <React.Fragment key={`peer-sponsor-row-${i}`}>
                                        <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {l ? <NameItem member={l} align="right" showRole={false} noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                        </div>
                                        <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {r ? <NameItem member={r} align="left" showRole={false} noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                        </div>
                                      </React.Fragment>
                                    )
                                  }
                                  return rows
                                })()
                              )}
                            </TwoColumnLayout>
                          </div>
                        )
                      }

                      if (category === "Family of the Groom" || category === "Family of the Bride") {
                        const familyGroom = grouped["Family of the Groom"] || []
                        const familyBride = grouped["Family of the Bride"] || []
                        if (familyGroom.length === 0 && familyBride.length === 0) return null
                        if (category === "Family of the Groom") {
                          renderedAny = true
                          return (
                            <div key="Family">
                              {divider}
                              <TwoColumnLayout leftTitle="Family of the Groom" rightTitle="Family of the Bride">
                                {(() => {
                                  const maxLen = Math.max(familyGroom.length, familyBride.length)
                                  const rows = []
                                  for (let i = 0; i < maxLen; i++) {
                                    const left = familyGroom[i]
                                    const right = familyBride[i]
                                    rows.push(
                                      <React.Fragment key={`family-row-${i}`}>
                                        <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {left ? <NameItem member={left} align="right" noWrap /> : <div className="py-0.5" />}
                                        </div>
                                        <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {right ? <NameItem member={right} align="left" noWrap /> : <div className="py-0.5" />}
                                        </div>
                                      </React.Fragment>
                                    )
                                  }
                                  return rows
                                })()}
                              </TwoColumnLayout>
                            </div>
                          )
                        }
                        return null
                      }

                      if (category === "Man of Honor" || category === "Matron of Honor" || category === "Maid of Honor" || category === "Best Man") {
                        const manOfHonor = grouped["Man of Honor"] || []
                        const matronOfHonor = grouped["Matron of Honor"] || []
                        const maidOfHonor = grouped["Maid of Honor"] || []
                        const bestMan = grouped["Best Man"] || []

                        const firstHonorCategory = HONOR_ATTENDANT_BLOCK_CATEGORIES.find((honorCategory) => (grouped[honorCategory]?.length ?? 0) > 0)
                        if (category !== firstHonorCategory) return null

                        renderedAny = true
                        const hasSideHonors = bestMan.length > 0 || maidOfHonor.length > 0
                        const hasMatron = matronOfHonor.length > 0

                        return (
                          <div key="HonorAttendants">
                            {divider}
                            {manOfHonor.length > 0 && (
                              <TwoColumnLayout singleTitle="Man of Honor" centerContent={true}>
                                {manOfHonor.map((member, idx) => (
                                  <div key={`man-of-honor-${idx}-${member.name}`} className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1">
                                    <NameItem member={member} align="center" noWrap />
                                  </div>
                                ))}
                              </TwoColumnLayout>
                            )}
                            {manOfHonor.length > 0 && (hasSideHonors || hasMatron) && (
                              <div className="flex justify-center py-1 sm:py-2 md:py-2.5 mb-1.5 sm:mb-2.5 md:mb-3">
                                <div className="w-full max-w-md h-px" style={dividerLineStyle} />
                              </div>
                            )}
                            {hasSideHonors && (
                              <TwoColumnLayout leftTitle="Best Man" rightTitle="Maid of Honor">
                                {(() => {
                                  const maxLen = Math.max(bestMan.length, maidOfHonor.length)
                                  const rows = []
                                  for (let i = 0; i < maxLen; i++) {
                                    const left = bestMan[i]
                                    const right = maidOfHonor[i]
                                    rows.push(
                                      <React.Fragment key={`honor-row-${i}`}>
                                        <div key={`bestman-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {left ? <NameItem member={left} align="right" noWrap /> : <div className="py-0.5" />}
                                        </div>
                                        <div key={`maid-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {right ? <NameItem member={right} align="left" noWrap /> : <div className="py-0.5" />}
                                        </div>
                                      </React.Fragment>
                                    )
                                  }
                                  return rows
                                })()}
                              </TwoColumnLayout>
                            )}
                            {hasSideHonors && hasMatron && (
                              <div className="flex justify-center py-1 sm:py-2 md:py-2.5 mb-1.5 sm:mb-2.5 md:mb-3">
                                <div className="w-full max-w-md h-px" style={dividerLineStyle} />
                              </div>
                            )}
                            {hasMatron && (
                              <TwoColumnLayout singleTitle="Matron of Honor" centerContent={true}>
                                {matronOfHonor.map((member, idx) => (
                                  <div key={`matron-of-honor-${idx}-${member.name}`} className="col-span-2 flex justify-center min-w-0 overflow-hidden px-0.5 sm:px-1">
                                    <NameItem member={member} align="center" showRole={false} noWrap />
                                  </div>
                                ))}
                              </TwoColumnLayout>
                            )}
                          </div>
                        )
                      }

                      if ((BEARER_BLOCK_CATEGORIES as readonly string[]).includes(category)) {
                        const firstBearer = BEARER_BLOCK_CATEGORIES.find((c) => (grouped[c]?.length ?? 0) > 0)
                        if (category !== firstBearer) return null
                        const ringBearer = grouped["Ring Bearer"] || []
                        const coinBearer = grouped["Coin Bearer"] || []
                        const bibleBearer = grouped["Bible Bearer"] || []
                        const hasSidePair = ringBearer.length > 0 || coinBearer.length > 0

                        renderedAny = true
                        return (
                          <div key="BearerBlock">
                            {divider}
                            {hasSidePair && (
                              <TwoColumnLayout leftTitle={ringBearer.length > 0 ? "Ring Bearer" : undefined} rightTitle={coinBearer.length > 0 ? "Coin Bearer" : undefined}>
                                {renderPairRows("bearer", ringBearer, coinBearer)}
                              </TwoColumnLayout>
                            )}
                            {bibleBearer.length > 0 && (
                              <TwoColumnLayout singleTitle="Bible Bearer" centerContent={true}>
                                <div className="col-span-full">
                                  <div className="flex flex-col items-center gap-5 sm:gap-6">
                                    {bibleBearer.map((member, idx) => (
                                      <NameItem key={`bible-bearer-${idx}-${member.name}`} member={member} align="center" noWrap />
                                    ))}
                                  </div>
                                </div>
                              </TwoColumnLayout>
                            )}
                          </div>
                        )
                      }

                      const pairedSection = PAIRED_COLUMN_SECTIONS.find((pair) => pair.left === category || pair.right === category)
                      if (pairedSection) {
                        const leftMembers = grouped[pairedSection.left] || []
                        const rightMembers = grouped[pairedSection.right] || []
                        const firstPresent = [pairedSection.left, pairedSection.right].find((c) => (grouped[c]?.length ?? 0) > 0)
                        if (category !== firstPresent) return null

                        renderedAny = true
                        return (
                          <div key={pairedSection.key}>
                            {divider}
                            <TwoColumnLayout leftTitle={leftMembers.length > 0 ? pairedSection.left : undefined} rightTitle={rightMembers.length > 0 ? pairedSection.right : undefined}>
                              {renderPairRows(pairedSection.key, leftMembers, rightMembers)}
                            </TwoColumnLayout>
                          </div>
                        )
                      }

                      if (category === "Little Groom" || category === "Little Bride") {
                        const littleGroom = grouped["Little Groom"] || []
                        const littleBride = grouped["Little Bride"] || []
                        if (littleGroom.length === 0 && littleBride.length === 0) return null

                        if (category === "Little Groom") {
                          renderedAny = true
                          return (
                            <div key="LittleOnes">
                              {divider}
                              <TwoColumnLayout leftTitle="Little Groom" rightTitle="Little Bride">
                                {(() => {
                                  const maxLen = Math.max(littleGroom.length, littleBride.length)
                                  const rows = []
                                  for (let i = 0; i < maxLen; i++) {
                                    const left = littleGroom[i]
                                    const right = littleBride[i]
                                    rows.push(
                                      <React.Fragment key={`little-row-${i}`}>
                                        <div key={`littlegroom-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {left ? <NameItem member={left} align="right" noWrap /> : <div className="py-0.5" />}
                                        </div>
                                        <div key={`littlebride-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {right ? <NameItem member={right} align="left" noWrap /> : <div className="py-0.5" />}
                                        </div>
                                      </React.Fragment>
                                    )
                                  }
                                  return rows
                                })()}
                              </TwoColumnLayout>
                            </div>
                          )
                        }
                        return null
                      }

                      if (category === "Flower Ladies") {
                        if (members.length === 0) return null
                        renderedAny = true
                        return (
                          <div key="FlowerLadies">
                            {divider}
                            <TwoColumnLayout singleTitle="Flower Girls" centerContent={true}>
                              {members.length === 2 ? (
                                <>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    <NameItem member={members[0]} align="right" noWrap />
                                  </div>
                                  <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                    <NameItem member={members[1]} align="left" noWrap />
                                  </div>
                                </>
                              ) : (
                                (() => {
                                  const half = Math.ceil(members.length / 2)
                                  const left = members.slice(0, half)
                                  const right = members.slice(half)
                                  const maxLen = Math.max(left.length, right.length)
                                  const rows = []
                                  for (let i = 0; i < maxLen; i++) {
                                    const l = left[i]
                                    const r = right[i]
                                    rows.push(
                                      <React.Fragment key={`flower-lady-row-${i}`}>
                                        <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {l ? <NameItem member={l} align="right" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                        </div>
                                        <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {r ? <NameItem member={r} align="left" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                        </div>
                                      </React.Fragment>
                                    )
                                  }
                                  return rows
                                })()
                              )}
                            </TwoColumnLayout>
                          </div>
                        )
                      }

                      if (category === "Bridesmaids" || category === "Groomsmen") {
                        const bridesmaids = grouped["Bridesmaids"] || []
                        const groomsmen = grouped["Groomsmen"] || []
                        if (bridesmaids.length === 0 && groomsmen.length === 0) return null

                        if (category === "Groomsmen") {
                          renderedAny = true
                          return (
                            <div key="BridalParty">
                              {divider}
                              <TwoColumnLayout singleTitle="Beloved Entourage">
                                {(() => {
                                  const maxLen = Math.max(bridesmaids.length, groomsmen.length)
                                  const rows = []
                                  for (let i = 0; i < maxLen; i++) {
                                    const groomsman = groomsmen[i]
                                    const bridesmaid = bridesmaids[i]
                                    rows.push(
                                      <React.Fragment key={`bridal-row-${i}`}>
                                        <div key={`groomsman-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {groomsman ? <NameItem member={groomsman} align="right" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                        </div>
                                        <div key={`bridesmaid-cell-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                          {bridesmaid ? <NameItem member={bridesmaid} align="left" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                        </div>
                                      </React.Fragment>
                                    )
                                  }
                                  return rows
                                })()}
                              </TwoColumnLayout>
                            </div>
                          )
                        }
                        return null
                      }

                      const secondarySponsorGroups = ["Candle Sponsors", "Candle Bearer", "Veil Sponsors", "Cord Sponsors", "Ribbon Sponsors"] as const
                      if ((secondarySponsorGroups as readonly string[]).includes(category)) {
                        const firstPresentGroup = secondarySponsorGroups.find((g) => (grouped[g]?.length ?? 0) > 0)
                        if (category !== firstPresentGroup) return null

                        const renderPairedGroup = (groupName: string) => {
                          const grpMembers = grouped[groupName] || []
                          if (grpMembers.length === 0) return null
                          if (TWO_COLUMN_SECONDARY_GROUPS.has(groupName) && grpMembers.length > 1) {
                            const half = Math.ceil(grpMembers.length / 2)
                            return (
                              <div key={groupName} className="mb-1.5 sm:mb-2.5 md:mb-3">
                                <TwoColumnLayout singleTitle={displayRoleCategory(groupName, grpMembers)} centerContent={true}>
                                  {renderPairRows(groupName, grpMembers.slice(0, half), grpMembers.slice(half))}
                                </TwoColumnLayout>
                              </div>
                            )
                          }
                          return (
                            <div key={groupName} className="mb-1.5 sm:mb-2.5 md:mb-3">
                              <TwoColumnLayout singleTitle={displayRoleCategory(groupName, grpMembers)} centerContent={true}>
                                {grpMembers.length === 2 ? (
                                  <>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      <NameItem member={grpMembers[0]} align="right" noWrap />
                                    </div>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      <NameItem member={grpMembers[1]} align="left" noWrap />
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-full">
                                    <div className="flex flex-col items-center gap-5 sm:gap-6">
                                      {grpMembers.map((member, idx) => (
                                        <NameItem key={`${groupName}-${idx}-${member.name}`} member={member} align="center" noWrap />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </TwoColumnLayout>
                            </div>
                          )
                        }

                        renderedAny = true
                        return (
                          <div key="SecondarySponsorBlock">
                            {divider}
                            <div className="mb-1.5 sm:mb-2.5 md:mb-3">
                              <SectionTitle>Secondary Sponsors</SectionTitle>
                            </div>
                            {secondarySponsorGroups.map(renderPairedGroup)}
                          </div>
                        )
                      }

                      if (members.length === 0) return null

                      renderedAny = true
                      return (
                        <div key={category}>
                          {divider}
                          <TwoColumnLayout singleTitle={displayRoleCategory(category, members)} centerContent={true}>
                            {(() => {
                              const PAIRED_SECTIONS = new Set(["Candle Sponsors", "Cord Sponsors", "Veil Sponsors", "Ribbon Sponsors", "Little Love Bearer", "Little Promise Bearer"])
                              if (PAIRED_SECTIONS.has(category) && members.length === 2) {
                                const left = members[0]
                                const right = members[1]
                                return (
                                  <>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      <NameItem member={left} align="right" noWrap />
                                    </div>
                                    <div className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      <NameItem member={right} align="left" noWrap />
                                    </div>
                                  </>
                                )
                              }
                              if (SINGLE_COLUMN_SECTIONS.has(category) || members.length <= 2) {
                                return (
                                  <div className="col-span-full">
                                    <div className="flex flex-col items-center gap-5 sm:gap-6">
                                      {members.map((member, idx) => (
                                        <NameItem key={`${category}-${idx}-${member.name}`} member={member} align="center" noWrap />
                                      ))}
                                    </div>
                                  </div>
                                )
                              }
                              const half = Math.ceil(members.length / 2)
                              const left = members.slice(0, half)
                              const right = members.slice(half)
                              const maxLen = Math.max(left.length, right.length)
                              const rows = []
                              for (let i = 0; i < maxLen; i++) {
                                const l = left[i]
                                const r = right[i]
                                rows.push(
                                  <React.Fragment key={`${category}-row-${i}`}>
                                    <div key={`${category}-cell-left-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      {l ? <NameItem member={l} align="right" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                    </div>
                                    <div key={`${category}-cell-right-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                      {r ? <NameItem member={r} align="left" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                    </div>
                                  </React.Fragment>
                                )
                              }
                              return rows
                            })()}
                          </TwoColumnLayout>
                        </div>
                      )
                    })}

                    {/* Display any other categories not in the ordered list */}
                    {Object.keys(grouped)
                      .filter(cat => !ROLE_CATEGORY_ORDER.includes(cat) && !["Parents of the Groom", "Parents of the Bride", "OFFICIATING MINISTER", "The Couple", "Other"].includes(cat))
                      .map((category) => {
                        const members = grouped[category]
                        if (members.length === 0) return null
                        const divider = renderedAny ? (
                          <div className="flex justify-center py-1 sm:py-2.5 md:py-3 mb-1.5 sm:mb-2.5 md:mb-3">
                            <div className="w-full max-w-md h-px" style={dividerLineStyle} />
                          </div>
                        ) : null
                        renderedAny = true

                        return (
                          <div key={category}>
                            {divider}
                            <TwoColumnLayout singleTitle={displayRoleCategory(category, members)} centerContent={true}>
                              {(() => {
                                if (SINGLE_COLUMN_SECTIONS.has(category) || members.length <= 2) {
                                  return (
                                    <div className="col-span-full">
                                      <div className="flex flex-col items-center gap-5 sm:gap-6">
                                        {members.map((member, idx) => (
                                          <NameItem key={`${category}-${idx}-${member.name}`} member={member} align="center" noWrap />
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                const half = Math.ceil(members.length / 2)
                                const left = members.slice(0, half)
                                const right = members.slice(half)
                                const maxLen = Math.max(left.length, right.length)
                                const rows = []
                                for (let i = 0; i < maxLen; i++) {
                                  const l = left[i]
                                  const r = right[i]
                                  rows.push(
                                    <React.Fragment key={`${category}-row-${i}`}>
                                      <div key={`${category}-cell-left-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                        {l ? <NameItem member={l} align="right" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                      </div>
                                      <div key={`${category}-cell-right-${i}`} className="px-0.5 sm:px-1 md:px-1.5 min-w-0 overflow-hidden">
                                        {r ? <NameItem member={r} align="left" noWrap /> : <div className="py-0.5 sm:py-1 md:py-1.5" />}
                                      </div>
                                    </React.Fragment>
                                  )
                                }
                                return rows
                              })()}
                            </TwoColumnLayout>
                          </div>
                        )
                      })}
                  </>
                )
              })()}
            </>
            )}
            </div>
          </div>
        </div>
      </div>
      </Section>
    </div>
  )
}