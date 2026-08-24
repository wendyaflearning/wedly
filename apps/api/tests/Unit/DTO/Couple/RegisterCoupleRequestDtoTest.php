<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Couple;

use App\DTO\Couple\ProviderContactRequestDto;
use App\DTO\Couple\RegisterCoupleRequestDto;
use App\Entity\ProviderLead\ProviderLead;
use App\Enum\Couple\PlanningStage;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Le payload arrive du sessionStorage, donc d'une source réinscriptible : ces
 * tests vérifient que chaque borne du parcours est bien rejouée côté serveur.
 */
final class RegisterCoupleRequestDtoTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    public function test_a_complete_payload_has_no_violations(): void
    {
        self::assertCount(0, $this->validator->validate($this->makeDto()));
    }

    public function test_password_shorter_than_eight_characters_is_rejected(): void
    {
        $violations = $this->validator->validate($this->makeDto(password: 'court', passwordConfirmation: 'court'));

        self::assertGreaterThan(0, $violations->count());
    }

    public function test_password_confirmation_must_match(): void
    {
        $violations = $this->validator->validate($this->makeDto(passwordConfirmation: 'autrechose'));

        self::assertCount(1, $violations);
        self::assertSame('Les mots de passe ne correspondent pas.', $violations[0]->getMessage());
    }

    public function test_a_past_wedding_date_is_rejected(): void
    {
        $violations = $this->validator->validate(
            $this->makeDto(weddingDate: new \DateTimeImmutable('yesterday')),
        );

        self::assertCount(1, $violations);
        self::assertSame('La date du mariage ne peut pas être dans le passé.', $violations[0]->getMessage());
    }

    public function test_today_is_an_acceptable_wedding_date(): void
    {
        self::assertCount(
            0,
            $this->validator->validate($this->makeDto(weddingDate: new \DateTimeImmutable('today'))),
        );
    }

    public function test_a_budget_above_the_bound_is_rejected(): void
    {
        $violations = $this->validator->validate(
            $this->makeDto(budgetCents: ProviderLead::MAX_BUDGET_CENTS + 1),
        );

        self::assertCount(1, $violations);
    }

    public function test_the_budget_bound_itself_is_accepted(): void
    {
        self::assertCount(
            0,
            $this->validator->validate($this->makeDto(budgetCents: ProviderLead::MAX_BUDGET_CENTS)),
        );
    }

    public function test_a_negative_budget_is_rejected(): void
    {
        self::assertCount(1, $this->validator->validate($this->makeDto(budgetCents: -1)));
    }

    public function test_a_guest_count_outside_the_slider_bounds_is_rejected(): void
    {
        self::assertCount(1, $this->validator->validate($this->makeDto(guestCount: 19)));
        self::assertCount(1, $this->validator->validate($this->makeDto(guestCount: 301)));
    }

    public function test_a_blank_location_is_rejected(): void
    {
        self::assertCount(1, $this->validator->validate($this->makeDto(location: '   ')));
    }

    public function test_a_non_uuid_vendor_id_is_rejected(): void
    {
        $violations = $this->validator->validate(
            $this->makeDto(contactRequest: new ProviderContactRequestDto('pas-un-uuid')),
        );

        self::assertCount(1, $violations);
    }

    public function test_a_valid_contact_request_has_no_violations(): void
    {
        self::assertCount(
            0,
            $this->validator->validate($this->makeDto(
                contactRequest: new ProviderContactRequestDto(
                    '0198f1c2-0000-7000-8000-000000000000',
                ),
            )),
        );
    }

    private function makeDto(
        string $email = 'camille@example.test',
        string $password = 'motdepasse',
        ?string $passwordConfirmation = null,
        string $firstName = 'Camille',
        PlanningStage $planningStage = PlanningStage::JustStarted,
        ?\DateTimeImmutable $weddingDate = null,
        string $location = 'Lyon',
        int $budgetCents = 2_350_000,
        int $guestCount = 100,
        bool $sensitiveDataConsent = false,
        array $confessionSlugs = [],
        array $cultureSlugs = [],
        ?ProviderContactRequestDto $contactRequest = null,
    ): RegisterCoupleRequestDto {
        return new RegisterCoupleRequestDto(
            email: $email,
            password: $password,
            passwordConfirmation: $passwordConfirmation ?? $password,
            firstName: $firstName,
            planningStage: $planningStage,
            weddingDate: $weddingDate ?? new \DateTimeImmutable('+1 year'),
            location: $location,
            budgetCents: $budgetCents,
            guestCount: $guestCount,
            sensitiveDataConsent: $sensitiveDataConsent,
            confessionSlugs: $confessionSlugs,
            cultureSlugs: $cultureSlugs,
            contactRequest: $contactRequest,
        );
    }
}
