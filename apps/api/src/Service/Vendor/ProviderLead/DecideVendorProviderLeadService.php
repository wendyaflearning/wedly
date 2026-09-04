<?php

declare(strict_types=1);

namespace App\Service\Vendor\ProviderLead;

use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadDecision;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Repository\ProviderLead\ProviderLeadRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

/**
 * Le prestataire tranche une demande de mise en relation (WED-51).
 *
 * C'est le seul endroit du projet qui écrit `Accepted` ou `Refused` : WED-131
 * avait posé les deux valeurs pour que le contrat de lecture existe avant
 * l'écriture, rien ne les posait jusqu'ici. Une acceptation dévoile les
 * coordonnées du couple au prestataire, et débloque en retour la fiche du
 * prestataire pour le couple (PROVIDER-LEAD-005) — d'où le soin mis sur qui a
 * le droit de l'écrire.
 *
 * Le flush est ici et pas dans l'Action (ADR-006).
 */
final readonly class DecideVendorProviderLeadService
{
    public function __construct(
        private EntityManagerInterface $em,
        private ProviderLeadRepository $providerLeadRepository,
    ) {}

    /**
     * @throws \DomainException 404 si la demande n'existe pas ou vise un autre prestataire,
     *                          409 si elle a déjà été tranchée
     */
    public function decide(Vendor $vendor, string $leadId, ProviderLeadDecision $decision): ProviderLead
    {
        $lead = $this->findOwnedLead($vendor, $leadId);

        // Pas de re-décision silencieuse : un prestataire qui rouvre un vieil
        // email et clique « accepter » sur une demande déjà refusée doit lire
        // qu'elle est close, pas la voir basculer sans un mot. Et côté couple,
        // un refus est définitif (PROVIDER-LEAD-008) — le réécrire ferait
        // réapparaître un prestataire que le couple avait vu dire non.
        if ($lead->getStatus() !== ProviderLeadStatus::Pending) {
            throw new \DomainException('Cette demande a déjà été traitée.', 409);
        }

        $lead->setStatus($decision->toStatus());

        $this->em->flush();

        return $lead;
    }

    /**
     * Introuvable et « appartient à quelqu'un d'autre » renvoient le même 404,
     * avec le même message : un 403 distinct confirmerait à un prestataire
     * l'existence de la demande d'un confrère, et un 409 sur un lead d'autrui en
     * révélerait jusqu'au statut.
     *
     * L'identifiant est validé avant la requête — Doctrine convertit lui-même
     * une chaîne non-UUID et lèverait une erreur de conversion, donc un 500 là
     * où l'utilisateur a simplement tapé une URL fausse.
     */
    private function findOwnedLead(Vendor $vendor, string $leadId): ProviderLead
    {
        if (!Uuid::isValid($leadId)) {
            throw new \DomainException('Demande introuvable.', 404);
        }

        $lead = $this->providerLeadRepository->find($leadId);

        if ($lead === null || $lead->getVendor() !== $vendor) {
            throw new \DomainException('Demande introuvable.', 404);
        }

        return $lead;
    }
}
