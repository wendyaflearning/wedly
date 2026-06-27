'use client'

import { useState } from 'react'
import Link from 'next/link'

export type Section = {
  key: string
  label: string
  href: string
  completed: boolean
  subtitle: string
  tip?: string
}

export type SectionGroup = {
  id: 'identite' | 'matching' | 'vitrine'
  label: string
  tabLabel: string
  sections: Section[]
}

function Legend() {
  return (
    <div className="flex items-center gap-5">
      <span className="flex items-center gap-1.5 font-manrope text-[11px] text-gris">
        <span className="w-2 h-2 rounded-full bg-highlight shrink-0" />
        En attente
      </span>
      <span className="flex items-center gap-1.5 font-manrope text-[11px] text-gris">
        <svg className="text-accent shrink-0" width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Complété
      </span>
    </div>
  )
}

function SectionCard({ section }: { section: Section }) {
  return (
    <div className="rounded-2xl bg-white border border-bordeaux/10 p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {section.completed ? (
            <svg
              className="shrink-0 text-accent"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3 8l3.5 3.5L13 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span className="shrink-0 w-2 h-2 rounded-full bg-highlight" />
          )}
          <h3 className="font-cormorant text-[18px] font-semibold text-bordeaux leading-snug">
            {section.label}
          </h3>
        </div>
        <Link
          href={section.href}
          className="shrink-0 font-manrope text-[13px] font-semibold text-accent hover:text-accent/75 transition-colors"
        >
          Modifier →
        </Link>
      </div>
      <p className="mt-1.5 ml-[26px] font-manrope text-[13px] text-gris leading-relaxed">
        {section.subtitle}
      </p>
      {!section.completed && section.tip && (
        <div className="mt-3 ml-[26px] rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
          <p className="font-manrope text-[10px] tracking-[0.12em] uppercase text-accent font-semibold mb-1">
            Astuce
          </p>
          <p className="font-manrope text-[13px] text-texte leading-relaxed">{section.tip}</p>
        </div>
      )}
    </div>
  )
}

interface ProfileHubClientProps {
  groups: SectionGroup[]
  sidebar: React.ReactNode
}

export default function ProfileHubClient({ groups, sidebar }: ProfileHubClientProps) {
  const [activeTab, setActiveTab] = useState<SectionGroup['id']>('identite')

  const activeGroup = groups.find((g) => g.id === activeTab) ?? groups[0]

  return (
    <>
      {/* Mobile tabs */}
      <div className="md:hidden border-b border-bordeaux/[0.08]">
        <div className="flex">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveTab(group.id)}
              className={[
                'flex-1 py-3 font-manrope text-[13px] font-semibold transition-colors',
                activeTab === group.id
                  ? 'text-bordeaux border-b-2 border-accent'
                  : 'text-gris',
              ].join(' ')}
            >
              {group.tabLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile content */}
      <div className="md:hidden px-5 py-6 flex flex-col gap-3">
        <Legend />
        {activeGroup.sections.map((section) => (
          <SectionCard key={section.key} section={section} />
        ))}
      </div>

      {/* Desktop layout — sidebar + grid */}
      <div className="hidden md:flex gap-14 max-w-[1200px] mx-auto px-[72px] py-10">
        <div className="shrink-0">{sidebar}</div>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          <Legend />
          {groups.map((group) => (
            <section key={group.id}>
              <p className="font-manrope text-[10px] tracking-[0.16em] uppercase text-bordeaux/40 mb-4">
                {group.label}
              </p>
              {group.id === 'identite' ? (
                <div className="flex flex-col gap-3">
                  {group.sections.map((section) => (
                    <SectionCard key={section.key} section={section} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {group.sections.map((section) => (
                    <SectionCard key={section.key} section={section} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
