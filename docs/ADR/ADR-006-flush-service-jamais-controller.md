# ADR-006 — Responsabilité du flush() : service, jamais controller

## Statut

Accepté — août 2026

## Contexte

Deux conventions coexistaient sans jamais avoir été tranchées :

- Flush dans le service (AdminVendorService, AdminVendorDraftService,
AdminVendorReviewService, AdminVendorInvitationService, VendorService,
VendorPublishService, InviteTokenService, BookingBlockerService)
- Flush dans le controller (legacy AbstractController, et certaines
Single Action Controller récentes qui délèguent la logique à un
service mais gardent le flush à l'extérieur, ex.
PatchVendorDashboardPortfolioTagsAction)

Découvert lors de la review de [WED-102](mention://issue/0f22e00f-082a-4752-a7f6-c66e017e8d9a) (PR #97, AdminTagTypeService)
en questionnant pourquoi ce service flush en interne.

## Décision

Toute classe \*Service qui modifie une entité est responsable de son
propre flush(). Le Controller (Single Action Controller) ne fait que :

1. Parser/valider la requête (DTO)
2. Appeler le service
3. Formatter la réponse

Le Controller n'appelle jamais flush() lui-même.

## Conséquences

Positives : le service représente une opération métier complète et
autonome, testable en isolation. Élimine le risque d'oubli de flush
au niveau controller (bug silencieux : 200 renvoyé sans écriture réelle).

Risque accepté : si une opération future doit toucher plusieurs
services dans une seule transaction atomique, ce pattern ne suffit
pas tel quel — prévoir un service orchestrateur dédié ou
$em->wrapInTransaction() à ce moment-là, pas de solution anticipée
maintenant.

## Révision prévue

Si un besoin de transaction multi-service apparaît (ex. création
couple + wedding en un seul commit).

**Ce cas est arrivé — voir « Révision — août 2026 » ci-dessous.**

## Référence

Découvert sur : PR #97 ([WED-102](mention://issue/0f22e00f-082a-4752-a7f6-c66e017e8d9a), AdminTagTypeService)

## Révision — août 2026 (WED-109)

Le cas prévu s'est présenté : l'inscription du couple crée `User`,
`Wedding`, `Couple`, `WeddingConsent` et, le cas échéant, `ProviderLead`
en un seul commit. Aucun de ces enregistrements n'a de sens seul — un
`Couple` sans `Wedding` est impossible (`NOT NULL`), et un consentement
RGPD orphelin serait pire qu'absent.

**Décision** : le service porte aussi la **transaction**, pas seulement
le flush. Concrètement `beginTransaction()` / `persist()` × N / `flush()`
/ `commit()`, avec `rollback()` sur tout `Throwable` puis relance de
l'exception.

Le Controller reste interdit de `flush()` **comme de**
`beginTransaction()` : sa responsabilité ne change pas.

Aucun service orchestrateur au-dessus des services existants n'a été
introduit. Un seul service métier possède l'opération de bout en bout,
ce qui reste testable en isolation — un orchestrateur n'aurait ajouté
qu'un niveau d'indirection sans propriétaire clair.

Références d'implémentation :

- `src/Service/Couple/CoupleRegistrationService.php` (WED-109)
- `src/Service/Vendor/AdminVendorDraftService.php::create` (précédent
  antérieur, déjà conforme à ce patron)

## Révision — septembre 2026 (WED-183)

Le dé-épinglage a introduit un troisième cas : une entité dont on inverse
l'état d'activité au lieu de la supprimer. `CouplePin` expose
`reactivate()` / `deactivate()` et **pas** de `setIsActive(bool)`.

**Décision** : pour toute entité en soft delete, deux verbes métier
plutôt qu'un setter booléen. `deactivate()` dit ce qui se passe côté
appelant ; `setIsActive(false)` demande au lecteur de le déduire, et
laisse la porte ouverte à un booléen calculé ailleurs dans le code.
C'est désormais le patron canonique pour les nouvelles entités.

`TagValue` et `Plan` restent sur `setIsActive()` : ils sont pilotés par
des formulaires d'administration qui passent un booléen déjà décidé en
amont, et les migrer ne réglerait aucun problème réel. Pas de
réécriture rétroactive.

Le flush reste dans le service : `DeleteCouplePinService::delete()`
appelle `deactivate()` puis `flush()`, l'Action ne fait que résoudre le
couple depuis le JWT et renvoyer 204.

Référence d'implémentation :

- `src/Entity/Couple/CouplePin.php` et
  `src/Service/Couple/Pin/DeleteCouplePinService.php` (WED-183)
