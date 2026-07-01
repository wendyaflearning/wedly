'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'

export type Section = {
  key: string
  label: string
  href: string
  completed: boolean
  subtitle: string
  tip?: string
  disabled?: boolean
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

function CardLockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0 text-bordeaux/40">
      <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function SectionCard({ section }: { section: Section }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {section.disabled ? (
            <CardLockIcon />
          ) : section.completed ? (
            <svg className="shrink-0 text-accent" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="shrink-0 w-2 h-2 rounded-full bg-highlight" />
          )}
          <h3 className="font-cormorant text-[18px] font-semibold text-bordeaux leading-snug">
            {section.label}
          </h3>
        </div>
        {!section.disabled && (
          <span className="shrink-0 font-manrope text-[13px] font-semibold text-accent group-hover:text-accent/75 transition-colors">
            Modifier →
          </span>
        )}
      </div>
      <p className="mt-1.5 ml-[26px] font-manrope text-[13px] text-gris leading-relaxed">
        {section.subtitle}
      </p>
      {!section.disabled && !section.completed && section.tip && (
        <div className="mt-3 ml-[26px] rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
          <p className="font-manrope text-[10px] tracking-[0.12em] uppercase text-accent font-semibold mb-1">
            Astuce
          </p>
          <p className="font-manrope text-[13px] text-texte leading-relaxed">{section.tip}</p>
        </div>
      )}
    </>
  )

  if (section.disabled) {
    return (
      <div className="rounded-2xl bg-white border border-bordeaux/10 p-5 md:p-6 opacity-40 cursor-default">
        {inner}
      </div>
    )
  }

  return (
    <Link
      href={section.href}
      className="block rounded-2xl bg-white border border-bordeaux/10 p-5 md:p-6 hover:border-bordeaux/25 hover:shadow-sm transition-all duration-200 group"
    >
      {inner}
    </Link>
  )
}

interface ProfileHubClientProps {
  groups: SectionGroup[]
  sidebar: React.ReactNode
  savedKey?: string
}

export default function ProfileHubClient({ groups, sidebar, savedKey }: ProfileHubClientProps) {
  const [activeTab, setActiveTab] = useState<SectionGroup['id']>('identite')
  const { toast, showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (savedKey === 'matching-consent') {
      showToast('success', 'Confidentialité du matching mise à jour ✓')
      router.replace('/dashboard/profile')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey])

  const activeGroup = groups.find((g) => g.id === activeTab) ?? groups[0]

  return (
    <>
      <Toast toast={toast} />
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
