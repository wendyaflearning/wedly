<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity\Wedding;

use App\Entity\Wedding\Wedding;
use App\Entity\Wedding\WeddingConsent;
use App\Enum\Couple\ConsentType;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

final class WeddingConsentTest extends TestCase
{
    public function test_it_records_a_granted_consent_for_its_wedding(): void
    {
        $wedding = new Wedding();

        $consent = new WeddingConsent($wedding, ConsentType::SensitiveData, true);

        $this->assertSame($wedding, $consent->getWedding());
        $this->assertSame(ConsentType::SensitiveData, $consent->getConsentType());
        $this->assertTrue($consent->isGranted());
    }

    public function test_a_refusal_is_recorded_as_its_own_entry(): void
    {
        $consent = new WeddingConsent(new Wedding(), ConsentType::SensitiveData, false);

        $this->assertFalse($consent->isGranted());
    }

    /**
     * The couple side mirrors `VendorConsent`: consent history is an audit trail,
     * so a decision is appended as a new row and never edited in place (WED-107).
     */
    public function test_it_exposes_no_way_to_rewrite_a_past_decision(): void
    {
        $setters = array_filter(
            (new ReflectionClass(WeddingConsent::class))->getMethods(),
            static fn ($method): bool => str_starts_with($method->getName(), 'set')
        );

        $this->assertSame([], $setters);
    }

    public function test_the_consent_type_matches_the_sensitive_preference_step(): void
    {
        $this->assertSame('sensitive_data', ConsentType::SensitiveData->value);
        $this->assertCount(1, ConsentType::cases());
    }
}
