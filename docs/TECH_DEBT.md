# Dette technique

Registre des raccourcis assumés en connaissance de cause, avec le seuil qui déclenche le remboursement.

## GetVendorDashboardPortfolioAction — N+1 potentiel sur les tags

- **Dette** : N+1 potentiel sur `GetVendorDashboardPortfolioAction` (styles/specialties lazy-loaded par image, une requête par relation à chaque image bouclée)
- **Seuil de déclenchement** : si un vendor dépasse ~20 photos en prod, ou alerte Sentry sur cette route
- **Remède** : eager loading (`JOIN FETCH` ou `EAGER` sur les relations) quand le seuil est atteint

## tag_type — faux positif permanent sur doctrine:schema:validate (WED-97)

- **Contexte** : index unique partiel `UNIQ_TAG_TYPE_SERVICE_PRIMARY` sur `tag_type(service_id) WHERE (is_primary = true)`, ajouté à la main dans la migration `Version20260803142800`. Doctrine ORM ne sait pas exprimer un index partiel (`WHERE`) via ses attributs, donc ce garde-fou métier (un seul `TagType` primaire actif par service) n'a pas d'équivalent dans le mapping d'entité.
- **Conséquence** : `doctrine:schema:validate` affichera en permanence `DROP INDEX uniq_tag_type_service_primary` comme diff. Idem pour tout futur `doctrine:migrations:diff` touchant `tag_type` : Doctrine proposera de le supprimer puisqu'il ne le connaît pas.
- **Consigne** : ne **jamais** appliquer ce DROP proposé par `schema:validate` ou par un `migrations:diff` sur cette table — c'est un garde-fou métier volontaire, pas une erreur de mapping.
- **Statut** : dette assumée, pas de remboursement prévu — limitation native de Doctrine ORM (pas d'index partiel), pas un raccourci qu'on compte combler.

## PortfolioPageClient — tagTypes résolus via le premier service du vendor (vendorServices[0])

- **Dette** : un vendor multi-services (freelance avec plusieurs métiers) ne peut taguer ses photos que selon la taxonomie de son premier service déclaré (`vendorServices[0]`) — pas de sélection de métier dans l'écran de tagging du dashboard.
- **Contexte** : simplification MVP actée pour WED-103 (tagging portfolio côté prestataire). La majorité des vendors n'ont qu'un seul service ; gérer le multi-service en V1 aurait ajouté une étape de sélection de métier non prévue dans le ticket.
- **Seuil de déclenchement** : retours terrain de vendors multi-services bloqués sur le tagging d'un second métier.
- **Remède** : ajouter un sélecteur de service dans l'écran de tagging du dashboard, ou reprendre `vendorServices` en entier au lieu du seul premier élément.
