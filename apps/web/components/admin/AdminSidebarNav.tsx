'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export type SidebarItem = {
  label: string
  icon?: ReactNode
  href?: string
  count?: number
  children?: SidebarItem[]
}

type SidebarSectionConfig = {
  title: string
  items: SidebarItem[]
}

function SidebarNavItem({
  item,
  active,
  indent = false,
}: {
  item: SidebarItem
  active: boolean
  indent?: boolean
}) {
  const className = [
    'flex items-center gap-4 no-underline transition-colors',
    indent ? 'h-[42px] pl-11 pr-6 text-[13.5px] font-semibold' : 'h-[50px] px-6 text-[15px] font-semibold',
    active ? 'bg-creme/12 text-creme' : 'text-creme/55 hover:bg-creme/8 hover:text-creme',
  ].join(' ')

  const content = (
    <>
      {item.icon}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {typeof item.count === 'number' && item.count > 0 ? (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-highlight px-2 text-xs font-bold text-creme">
          {item.count}
        </span>
      ) : null}
    </>
  )

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <div className={className} aria-disabled="true">
      {content}
    </div>
  )
}

function SidebarNavGroup({
  item,
  pathname,
}: {
  item: SidebarItem & { children: SidebarItem[] }
  pathname: string
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex h-9 w-full items-center gap-2 px-6 text-left text-[11px] font-bold uppercase tracking-wider text-creme/40 transition-colors hover:text-creme/65"
      >
        <ChevronRight
          size={12}
          strokeWidth={2.5}
          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
        <span className="flex-1 truncate">{item.label}</span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="flex flex-col overflow-hidden">
          {item.children.map((child) => (
            <SidebarNavItem
              key={child.label}
              item={child}
              active={!!child.href && pathname.startsWith(child.href)}
              indent
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminSidebarNav({ sections }: { sections: SidebarSectionConfig[] }) {
  const pathname = usePathname()

  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="px-6 text-xs font-bold uppercase text-creme/35">{section.title}</h2>
          <nav className="flex flex-col">
            {section.items.map((item) =>
              item.children ? (
                <SidebarNavGroup
                  key={item.label}
                  item={item as SidebarItem & { children: SidebarItem[] }}
                  pathname={pathname}
                />
              ) : (
                <SidebarNavItem
                  key={item.label}
                  item={item}
                  active={!!item.href && pathname.startsWith(item.href)}
                />
              )
            )}
          </nav>
        </section>
      ))}
    </>
  )
}
