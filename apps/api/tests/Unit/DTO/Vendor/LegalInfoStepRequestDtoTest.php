<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Vendor;

use App\DTO\Vendor\Onboarding\LegalInfoStepRequestDto;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Test de caractérisation du format de téléphone (WED-216).
 *
 * Cette validation était jusqu'ici la seule occurrence du pattern dans
 * `apps/api` et n'était couverte par aucun test : elle est figée ici *avant*
 * d'être extraite en contrainte réutilisable, pour que l'extraction se prouve
 * iso-comportement au lieu de se supposer telle.
 *
 * Ne teste que le téléphone : les autres champs sont valides et hors sujet.
 */
final class LegalInfoStepRequestDtoTest extends TestCase
{
    private const INVALID_PHONE_MESSAGE = 'Le numéro de téléphone est invalide (ex : 0612345678 ou +33612345678).';

    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    /**
     * Les deux écritures qu'un prestataire français saisit réellement : le
     * format national et le format international.
     */
    #[DataProvider('acceptedPhoneProvider')]
    public function test_a_valid_french_phone_number_is_accepted(string $phone): void
    {
        self::assertCount(0, $this->validator->validate($this->makeDto($phone)));
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function acceptedPhoneProvider(): iterable
    {
        yield 'format national'      => ['0612345678'];
        yield 'format international' => ['+33612345678'];
    }

    #[DataProvider('rejectedPhoneProvider')]
    public function test_an_invalid_phone_number_is_rejected_with_its_message(string $phone): void
    {
        $violations = $this->validator->validate($this->makeDto($phone));

        self::assertCount(1, $violations);
        self::assertSame(self::INVALID_PHONE_MESSAGE, $violations[0]->getMessage());
        self::assertSame('phone', $violations[0]->getPropertyPath());
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function rejectedPhoneProvider(): iterable
    {
        yield 'trop court'                 => ['123'];
        yield 'indicatif national doublé'  => ['0012345678'];
    }

    /**
     * Le téléphone n'a jamais été obligatoire côté prestataire : l'absence de
     * valeur ne doit produire aucune violation, sans quoi l'extraction en
     * contrainte réutilisable rendrait obligatoire un champ qui ne l'est pas.
     */
    public function test_a_missing_phone_number_is_accepted(): void
    {
        self::assertCount(0, $this->validator->validate($this->makeDto(null)));
    }

    private function makeDto(?string $phone): LegalInfoStepRequestDto
    {
        return LegalInfoStepRequestDto::fromArray([
            'brand_name' => 'Studio Lumière',
            'first_name' => 'Camille',
            'last_name'  => 'Durand',
            'siret'      => '12345678901234',
            'phone'      => $phone,
        ]);
    }
}
