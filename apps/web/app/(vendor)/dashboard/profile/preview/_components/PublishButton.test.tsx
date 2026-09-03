import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PublishButtonView, type PublishButtonViewProps } from './PublishButton'

/**
 * La vue ne lit rien et n'appelle rien : le rendu statique suffit à vérifier ce
 * que le CA demande — bouton actif ou non, libellé, message d'erreur.
 */
function render(props: Partial<PublishButtonViewProps> = {}): string {
  return renderToStaticMarkup(
    <PublishButtonView
      missing={[]}
      isPublished={false}
      isSubmitting={false}
      error={null}
      onPublish={() => {}}
      {...props}
    />,
  )
}

describe('bouton publier', () => {
  it('est actif quand toutes les sections sont remplies', () => {
    const html = render()

    expect(html).toContain('Publier mon profil')
    expect(html).toContain('aria-disabled="false"')
    expect(html).not.toContain('cursor-not-allowed')
  })

  it('est désactivé tant qu’une section manque', () => {
    const html = render({ missing: [{ label: 'Biographie', href: '/dashboard/profile/bio' }] })

    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('cursor-not-allowed')
  })

  it('nomme au survol ce qu’il reste à compléter', () => {
    const html = render({
      missing: [
        { label: 'Biographie', href: '/dashboard/profile/bio' },
        { label: 'Tarifs', href: '/dashboard/profile/pricing-zone' },
      ],
    })

    expect(html).toContain('Biographie, Tarifs')
  })

  it('bascule sur « Profil publié » une fois le profil en ligne', () => {
    const html = render({ isPublished: true })

    expect(html).toContain('Profil publié')
    expect(html).not.toContain('Publier mon profil')
    expect(html).toContain('disabled=""')
    expect(html).toContain('cursor-not-allowed')
  })

  it('se verrouille pendant l’envoi pour éviter un double clic', () => {
    const html = render({ isSubmitting: true })

    expect(html).toContain('Publication')
    expect(html).toContain('aria-disabled="true"')
    expect(html).toContain('cursor-not-allowed')
  })

  /**
   * Le bouton était en `hidden sm:flex` : aucun prestataire sur smartphone ne
   * pouvait publier. Il se réduit désormais à son icône, comme le lien
   * « Modifier mon profil » voisin.
   */
  it('reste visible sur mobile, réduit à son icône', () => {
    const html = render()

    expect(html).not.toContain('hidden sm:flex')
    expect(html).toContain('<svg')
    // Le libellé disparaît sous le point de rupture, l'icône jamais.
    expect(html).toContain('<span class="hidden sm:inline">Publier mon profil</span>')
  })

  it('garde une icône dans chaque état, y compris pendant l’envoi', () => {
    for (const props of [{}, { isSubmitting: true }, { isPublished: true }]) {
      expect(render(props)).toContain('<svg')
    }
  })

  it('nomme le bouton pour les lecteurs d’écran quand le libellé est masqué', () => {
    expect(render()).toContain('aria-label="Publier mon profil"')
    expect(render({ isPublished: true })).toContain('aria-label="Profil publié"')
  })

  it('affiche les sections refusées par l’API', () => {
    const html = render({ error: 'À compléter : Portfolio.' })

    expect(html).toContain('À compléter : Portfolio.')
    expect(html).toContain('role="alert"')
  })
})
