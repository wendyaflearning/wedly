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

## Référence

Découvert sur : PR #97 ([WED-102](mention://issue/0f22e00f-082a-4752-a7f6-c66e017e8d9a), AdminTagTypeService)
