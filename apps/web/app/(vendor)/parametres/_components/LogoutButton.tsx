'use client'

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-[13px] font-medium text-highlight cursor-pointer hover:opacity-75 transition-opacity"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5.5 12H2.5a1 1 0 01-1-1V3a1 1 0 011-1H5.5" stroke="#E35704" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M9.5 10l3-3-3-3M12.5 7H5.5" stroke="#E35704" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Se déconnecter
    </button>
  )
}
