export default function CompletionScreen() {
  return (
    <div className="min-h-screen bg-creme flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center" style={{ padding: '32px' }}>
        <img src="/logo.png" alt="Wedly" className="h-16 w-auto mx-auto mb-8" />
        <h2
          className="font-cormorant font-light"
          style={{ fontSize: 'clamp(20px, 2.8vw, 32px)', color: '#291A10', lineHeight: 1.3, marginBottom: 16 }}
        >
          Votre profil est en cours <em>de validation.</em>
        </h2>
        <p className="font-cormorant font-light" style={{ fontSize: 16, color: 'rgba(41,26,16,0.6)', lineHeight: 1.8 }}>
          Notre équipe revient vers vous sous 48 à 72h.
        </p>
      </div>
    </div>
  )
}
