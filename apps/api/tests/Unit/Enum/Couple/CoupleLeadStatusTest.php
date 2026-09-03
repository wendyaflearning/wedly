<?php

declare(strict_types=1);

namespace App\Tests\Unit\Enum\Couple;

use App\Enum\Couple\CoupleLeadStatus;
use App\Enum\ProviderLead\ProviderLeadStatus;
use PHPUnit\Framework\TestCase;

final class CoupleLeadStatusTest extends TestCase
{
    /**
     * Le garde-fou du contrat : si Epic 3 ajoute une valeur à
     * `ProviderLeadStatus` sans décider ce qu'elle montre au couple, ce test
     * échoue au lieu de laisser un statut inconnu se projeter par défaut.
     */
    public function testEveryProviderLeadStatusProjectsToACoupleStatus(): void
    {
        foreach (ProviderLeadStatus::cases() as $status) {
            self::assertInstanceOf(
                CoupleLeadStatus::class,
                CoupleLeadStatus::fromProviderLeadStatus($status),
                sprintf('Le statut « %s » ne se projette sur aucun statut couple.', $status->value),
            );
        }
    }

    public function testOnlyAnExplicitAcceptanceUnlocksTheVendorProfile(): void
    {
        $unlocking = array_filter(
            ProviderLeadStatus::cases(),
            static fn(ProviderLeadStatus $status) => CoupleLeadStatus::fromProviderLeadStatus($status)
                ->revealsVendorIdentity(),
        );

        self::assertEqualsCanonicalizing(
            [ProviderLeadStatus::Accepted, ProviderLeadStatus::Confirmed, ProviderLeadStatus::Contacted],
            array_values($unlocking),
        );
    }

    public function testARefusalIsDistinctFromAnAbsenceOfAnswer(): void
    {
        self::assertSame(
            CoupleLeadStatus::Refusee,
            CoupleLeadStatus::fromProviderLeadStatus(ProviderLeadStatus::Refused),
        );
        self::assertSame(
            CoupleLeadStatus::Refusee,
            CoupleLeadStatus::fromProviderLeadStatus(ProviderLeadStatus::Unavailable),
        );
        self::assertSame(
            CoupleLeadStatus::EnAttente,
            CoupleLeadStatus::fromProviderLeadStatus(ProviderLeadStatus::Pending),
        );
    }

    /**
     * `Closed` n'exprime aucune décision : le lire comme une acceptation
     * ferait fuiter les coordonnées du prestataire.
     */
    public function testAGenericClosedStatusStaysMasked(): void
    {
        $status = CoupleLeadStatus::fromProviderLeadStatus(ProviderLeadStatus::Closed);

        self::assertFalse($status->revealsVendorIdentity());
        self::assertSame(CoupleLeadStatus::EnAttente, $status);
    }
}
