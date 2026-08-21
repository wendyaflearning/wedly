<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity\ProviderLead;

use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\Vendor\Vendor;
use App\Enum\ProviderLead\ProviderLeadOrigin;
use App\Enum\ProviderLead\ProviderLeadStatus;
use PHPUnit\Framework\TestCase;

final class ProviderLeadTest extends TestCase
{
    public function testItStartsAsAnUnlockedWedreamLeadPendingForTheTargetVendor(): void
    {
        $couple = new Couple();
        $vendor = new Vendor();

        $lead = new ProviderLead($couple, $vendor, 250_000);

        self::assertSame($couple, $lead->getCouple());
        self::assertSame($vendor, $lead->getVendor());
        self::assertSame(250_000, $lead->getBudgetCents());
        self::assertSame(ProviderLeadStatus::Pending, $lead->getStatus());
        self::assertTrue($lead->isUnlocked());
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

    public function testItsStatusAndUnlockStateCanBeUpdatedByTheLaterLeadWorkflow(): void
    {
        $lead = new ProviderLead(new Couple(), new Vendor(), 250_000);

        $lead->setStatus(ProviderLeadStatus::Contacted)->setUnlocked(false);

        self::assertSame(ProviderLeadStatus::Contacted, $lead->getStatus());
        self::assertFalse($lead->isUnlocked());
    }
}
