'use client'

import Image from 'next/image'
import { Settings, Upload, LayoutDashboard, Package } from 'lucide-react'

interface LandingHeroProps {
  onOpenBuilder: () => void
}

const pipelineSteps = ['Upload CSV / Excel', 'Preview', 'Download package'] as const

export function LandingHero({ onOpenBuilder }: LandingHeroProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] flex-col overflow-hidden bg-white">
      <div className="landing-bg-stack" aria-hidden>
        <div className="landing-bg-mesh" />
        <div className="landing-bg-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.14),transparent_55%)]" />
        <div
          className="landing-blob-animate absolute -right-24 top-16 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/12 to-transparent blur-3xl"
        />
        <div
          className="landing-blob-animate-delayed absolute -left-20 bottom-0 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-violet-400/15 via-blue-300/10 to-transparent blur-3xl"
        />
        <div className="landing-bg-orb-mid" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgb(248_250_252/0.92)_100%)]" />
      </div>

      {/* Top accent shimmer */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-[5] w-[min(90%,48rem)] -translate-x-1/2 overflow-hidden bg-gradient-to-r from-transparent via-blue-400/40 to-transparent h-px"
      >
        <div className="landing-top-shimmer h-full w-1/3 bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      </div>

      <div className="landing-content-layer flex min-h-0 flex-1 flex-col">
        <div className="relative flex w-full flex-1 flex-col items-center justify-center px-5 pb-20 pt-12 sm:px-8 md:pb-28 md:pt-16">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p
            className="animate-landing-hero-base animate-landing-delay-1 mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600 sm:text-xs"
          >
            Coherent Market Insights
          </p>

          <h1 className="animate-landing-title animate-landing-delay-2 font-sans text-[2.15rem] font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.1] md:text-6xl md:leading-[1.08]">
            Build market dashboards{' '}
            <span className="landing-gradient-text">in minutes</span>
            <span className="text-slate-900">, not days.</span>
          </h1>

          <p className="animate-landing-hero-base animate-landing-delay-3 mx-auto mt-7 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-relaxed">
            Upload your value and volume files, add intelligence tables, and open a full interactive
            analytics workspace—no manual chart rebuilds every time the data updates.
          </p>

          <div className="animate-landing-hero-base animate-landing-delay-4 mt-11 flex flex-col items-stretch gap-6 sm:mt-12 sm:items-center">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-8">
              <button
                type="button"
                onClick={onOpenBuilder}
                className="landing-btn-pulse-ring group relative inline-flex min-h-[52px] items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 px-9 py-3.5 text-base font-semibold text-white shadow-[0_4px_24px_-4px_rgb(37_99_235/0.55),0_0_0_1px_rgb(29_78_216/0.08)_inset] transition-[transform,box-shadow] duration-200 hover:from-blue-500 hover:to-blue-600 hover:shadow-[0_8px_32px_-6px_rgb(37_99_235/0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.98]"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 translate-y-full bg-gradient-to-t from-white/0 via-white/10 to-white/0 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                />
                <Settings className="relative h-5 w-5 shrink-0 opacity-95" aria-hidden />
                <span className="relative">Dashboard Builder</span>
              </button>

              <div
                className="hidden h-8 w-px shrink-0 bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block"
                aria-hidden
              />

              <div
                className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-sm text-slate-500"
                aria-label="Workflow"
              >
                {pipelineSteps.map((label, i) => (
                  <span key={label} className="inline-flex items-center gap-1">
                    {i > 0 && (
                      <span className="mx-2 text-slate-300 select-none" aria-hidden>
                        |
                      </span>
                    )}
                    <span className="font-medium text-slate-600">{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="animate-landing-hero-base animate-landing-delay-5 mx-auto mt-20 w-full max-w-5xl px-0 sm:mt-24">
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
            <article
              className="landing-card-enter landing-card-delay-1 landing-hover-card group relative rounded-2xl border border-slate-200/90 bg-white/90 p-7 text-center shadow-[0_1px_0_rgb(0_0_0/0.04)] backdrop-blur-sm"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-600 shadow-[0_1px_0_rgb(59_130_246/0.06)_inset] transition-transform duration-300 group-hover:scale-105">
                <Upload className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="font-sans text-base font-semibold tracking-tight text-slate-900">
                Upload once
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                Value, volume, and intelligence spreadsheets—aligned to how you already model the
                market.
              </p>
            </article>

            <article
              className="landing-card-enter landing-card-delay-2 landing-hover-card group relative rounded-2xl border border-slate-200/90 bg-white/90 p-7 text-center shadow-[0_1px_0_rgb(0_0_0/0.04)] backdrop-blur-sm"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100/70 text-indigo-600 shadow-[0_1px_0_rgb(99_102_241/0.06)_inset] transition-transform duration-300 group-hover:scale-105">
                <LayoutDashboard className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="font-sans text-base font-semibold tracking-tight text-slate-900">
                Explore visually
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                Bars, lines, heatmaps, waterfalls, and tables stay in sync with your geography and
                segment filters.
              </p>
            </article>

            <article
              className="landing-card-enter landing-card-delay-3 landing-hover-card group relative rounded-2xl border border-slate-200/90 bg-white/90 p-7 text-center shadow-[0_1px_0_rgb(0_0_0/0.04)] backdrop-blur-sm sm:col-span-1"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-100/60 text-violet-700 shadow-[0_1px_0_rgb(139_92_246/0.06)_inset] transition-transform duration-300 group-hover:scale-105">
                <Package className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="font-sans text-base font-semibold tracking-tight text-slate-900">
                Ship anywhere
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                Export a deployment-ready dashboard package when reviewers sign off—not after
                another rebuild cycle.
              </p>
            </article>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export function LandingHeader({
  onOpenBuilder,
}: {
  onOpenBuilder: () => void
}) {
  return (
    <header className="landing-header-enter sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/70">
      <div className="container mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 flex-shrink-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="Coherent Market Insights"
            width={160}
            height={64}
            className="h-10 w-auto max-w-[min(280px,calc(100vw-220px))] object-contain sm:h-11"
            priority
          />
        </div>

        <button
          type="button"
          onClick={onOpenBuilder}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 transition-[transform,background-color,box-shadow] duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.98]"
        >
          <Settings className="h-4 w-4 opacity-95" aria-hidden />
          Dashboard Builder
        </button>
      </div>
    </header>
  )
}
