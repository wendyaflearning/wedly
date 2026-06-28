<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor;

use App\DTO\Vendor\PatchBioRequestDto;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;

final class PatchBioRequestDtoTest extends TestCase
{
    private \Symfony\Component\Validator\Validator\ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    public function test_bio_at_minimum_length_has_no_violations(): void
    {
        $dto = new PatchBioRequestDto(str_repeat('a', 50));
        $this->assertCount(0, $this->validator->validate($dto));
    }

    public function test_bio_at_maximum_length_has_no_violations(): void
    {
        $dto = new PatchBioRequestDto(str_repeat('a', 300));
        $this->assertCount(0, $this->validator->validate($dto));
    }

    public function test_bio_too_short_returns_french_violation(): void
    {
        $dto = new PatchBioRequestDto(str_repeat('a', 49));
        $violations = $this->validator->validate($dto);

        $this->assertCount(1, $violations);
        $this->assertSame(
            'La bio doit contenir au moins 50 caractères.',
            $violations[0]->getMessage()
        );
    }

    public function test_bio_too_long_returns_french_violation(): void
    {
        $dto = new PatchBioRequestDto(str_repeat('a', 301));
        $violations = $this->validator->validate($dto);

        $this->assertCount(1, $violations);
        $this->assertSame(
            'La bio ne peut pas dépasser 300 caractères.',
            $violations[0]->getMessage()
        );
    }

    public function test_empty_bio_returns_not_blank_violation(): void
    {
        $dto = new PatchBioRequestDto('');
        $violations = $this->validator->validate($dto);

        $messages = array_map(fn($violation) => $violation->getMessage(), iterator_to_array($violations));
        $this->assertContains('La bio ne peut pas être vide.', $messages);
    }
}
