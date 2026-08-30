<?php

declare(strict_types=1);

namespace App\Tests\Unit\Enum\Couple;

use App\Enum\Couple\PlanningStage;
use PHPUnit\Framework\TestCase;

final class PlanningStageTest extends TestCase
{
    public function test_backed_values_match_the_agreed_scale(): void
    {
        $this->assertSame('just_started', PlanningStage::JustStarted->value);
        $this->assertSame('in_progress', PlanningStage::InProgress->value);
        $this->assertSame('almost_ready', PlanningStage::AlmostReady->value);
    }

    public function test_exposes_exactly_three_cases(): void
    {
        $this->assertCount(3, PlanningStage::cases());
    }
}
