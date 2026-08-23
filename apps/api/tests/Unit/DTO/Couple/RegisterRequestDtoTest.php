<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Couple;

use App\DTO\Couple\RegisterRequestDto;
use App\Entity\ProviderLead\ProviderLead;
use App\Enum\Couple\PlanningStage;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * The onboarding state is held in a sessionStorage the couple can rewrite, so
 * these are the constraints that stand between that state and columns that would
 * otherwise fail at insert time with a 500.
 */
final class RegisterRequestDtoTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    public function test_a_complete_submission_is_accepted(): void
    {
        $this->assertSame([], $this->violations($this->dto()));
    }

    public function test_a_password_shorter_than_eight_characters_is_refused(): void
    {
        $this->assertContains('password', $this->violations($this->dto(password: 'court12', passwordConfirmation: 'court12')));
    }

    public function test_a_confirmation_that_differs_is_refused(): void
    {
        $this->assertContains('passwordConfirmation', $this->violations($this->dto(passwordConfirmation: 'autre-mot-de-passe')));
    }

    public function test_an_invalid_email_is_refused(): void
    {
        $this->assertContains('email', $this->violations($this->dto(email: 'camille')));
    }

    public function test_the_three_not_null_columns_left_empty_are_refused(): void
    {
        $violations = $this->violations(new RegisterRequestDto(
            email: 'camille@exemple.fr',
            password: 'secret-password',
            passwordConfirmation: 'secret-password',
            firstName: 'Camille',
            planningStage: null,
            weddingDate: null,
            location: '  ',
            budgetCents: 2_350_000,
            guestCount: 120,
        ));

        $this->assertContains('planningStage', $violations);
        $this->assertContains('weddingDate', $violations);
        $this->assertContains('location', $violations);
    }

    public function test_a_planning_stage_that_does_not_exist_is_refused(): void
    {
        $this->assertContains('planningStage', $this->violations($this->dto(planningStage: 'presque-fini')));
    }

    public function test_a_wedding_date_in_the_past_is_refused(): void
    {
        $violations = $this->violations($this->dto(weddingDate: new \DateTimeImmutable('yesterday')));

        $this->assertContains('weddingDate', $violations);
    }

    public function test_a_budget_past_the_integer_column_ceiling_is_refused(): void
    {
        $violations = $this->violations($this->dto(budgetCents: ProviderLead::MAX_BUDGET_CENTS + 1));

        $this->assertContains('budgetCents', $violations);
    }

    public function test_a_guest_count_outside_the_slider_bounds_is_refused(): void
    {
        $this->assertContains('guestCount', $this->violations($this->dto(guestCount: 5)));
        $this->assertContains('guestCount', $this->violations($this->dto(guestCount: 100_000)));
    }

    public function test_a_vendor_id_that_is_not_a_uuid_is_refused(): void
    {
        $this->assertContains('vendorId', $this->violations($this->dto(vendorId: 'photographe-lyon')));
    }

    public function test_a_couple_without_contact_request_carries_no_vendor(): void
    {
        $this->assertSame([], $this->violations($this->dto(vendorId: null)));
    }

    /** @return string[] */
    private function violations(RegisterRequestDto $dto): array
    {
        $paths = [];

        foreach ($this->validator->validate($dto) as $violation) {
            $paths[] = $violation->getPropertyPath();
        }

        return $paths;
    }

    private function dto(
        string $email = 'camille@exemple.fr',
        string $password = 'secret-password',
        string $passwordConfirmation = 'secret-password',
        string $firstName = 'Camille',
        ?string $planningStage = PlanningStage::JustStarted->value,
        ?\DateTimeImmutable $weddingDate = null,
        string $location = 'Lyon',
        ?int $budgetCents = 2_350_000,
        ?int $guestCount = 120,
        ?string $vendorId = null,
    ): RegisterRequestDto {
        return new RegisterRequestDto(
            email: $email,
            password: $password,
            passwordConfirmation: $passwordConfirmation,
            firstName: $firstName,
            planningStage: $planningStage,
            weddingDate: $weddingDate ?? new \DateTimeImmutable('+1 year'),
            location: $location,
            budgetCents: $budgetCents,
            guestCount: $guestCount,
            vendorId: $vendorId,
        );
    }
}
