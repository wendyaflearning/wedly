# Dette technique

Registre des raccourcis assumés en connaissance de cause, avec le seuil qui déclenche le remboursement.

## GetVendorDashboardPortfolioAction — N+1 potentiel sur les tags

- **Dette** : N+1 potentiel sur `GetVendorDashboardPortfolioAction` (styles/specialties lazy-loaded par image, une requête par relation à chaque image bouclée)
- **Seuil de déclenchement** : si un vendor dépasse ~20 photos en prod, ou alerte Sentry sur cette route
- **Remède** : eager loading (`JOIN FETCH` ou `EAGER` sur les relations) quand le seuil est atteint
