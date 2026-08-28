<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadOrigin;
use App\Enum\ProviderLead\ProviderLeadStatus;
use PHPUnit\Framework\TestCase;

final class ProviderLeadTest extends TestCase
{
    public function testItStartsAsAWedreamLeadPendingForTheTargetVendor(): void
    {
        $couple = new Couple();
        $vendor = new Vendor();

        $lead = new ProviderLead($couple, $vendor, 250_000);

        self::assertSame($couple, $lead->getCouple());
        self::assertSame($vendor, $lead->getVendor());
        self::assertSame(250_000, $lead->getBudgetCents());
        self::assertSame(ProviderLeadStatus::Pending, $lead->getStatus());
        self::assertSame(ProviderLeadOrigin::Wedream, $lead->getOrigin());
    }

    public function testItAcceptsTheWholeRangeItsIntegerColumnCanHold(): void
    {
        $free = new ProviderLead(new Couple(), new Vendor(), 0);
        $highest = new ProviderLead(new Couple(), new Vendor(), ProviderLead::MAX_BUDGET_CENTS);

        self::assertSame(0, $free->getBudgetCents());
        self::assertSame(ProviderLead::MAX_BUDGET_CENTS, $highest->getBudgetCents());
    }

    /**
     * The budget travels from client-held onboarding state, so an amount that
     * `budget_cents` cannot store must be refused here rather than at insert time.
     */
    public function testItRefusesABudgetItsIntegerColumnCannotStore(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new ProviderLead(new Couple(), new Vendor(), ProviderLead::MAX_BUDGET_CENTS + 1);
    }

    public function testItRefusesANegativeBudget(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new ProviderLead(new Couple(), new Vendor(), -1);
    }

    public function testItsStatusCanBeUpdatedByTheLaterLeadWorkflow(): void
    {
        $lead = new ProviderLead(new Couple(), new Vendor(), 250_000);

        $lead->setStatus(ProviderLeadStatus::Contacted);

        self::assertSame(ProviderLeadStatus::Contacted, $lead->getStatus());
    }

    public function testItCarriesTheCrushPhotoTheCoupleClickedOn(): void
    {
        $vendor = new Vendor();
        $photo  = (new PortfolioImage())->setVendor($vendor)->setUrl('https://cdn.wedly.test/p.jpg')->setSortOrder(0);

        $lead = new ProviderLead(new Couple(), $vendor, 250_000, $photo);

        self::assertSame($photo, $lead->getPortfolioImage());
    }

    public function testALeadCanExistWithoutACrushPhoto(): void
    {
        self::assertNull((new ProviderLead(new Couple(), new Vendor(), 250_000))->getPortfolioImage());
    }

    /**
     * Une photo d'un autre prestataire afficherait, une fois la fiche dévoilée,
     * le travail d'un tiers sous le nom du prestataire contacté.
     */
    public function testItRefusesAPhotoBelongingToAnotherVendor(): void
    {
        $photo = (new PortfolioImage())->setVendor(new Vendor())->setUrl('https://cdn.wedly.test/p.jpg')->setSortOrder(0);

        $this->expectException(\InvalidArgumentException::class);

        new ProviderLead(new Couple(), new Vendor(), 250_000, $photo);
    }
}
