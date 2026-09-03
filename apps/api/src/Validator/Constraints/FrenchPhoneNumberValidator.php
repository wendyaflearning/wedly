<?php

declare(strict_types=1);

namespace App\Validator\Constraints;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

/**
 * Sans dépendance de constructeur, volontairement : les tests de DTO du projet
 * s'appuient sur `Validation::createValidatorBuilder()` et n'ont donc pas de
 * conteneur pour instancier ce validateur autrement qu'avec un `new`.
 *
 * Ne transforme rien — le format entrant reste tel quel. La normalisation du
 * numéro persisté est la responsabilité du service qui écrit (WED-216).
 */
final class FrenchPhoneNumberValidator extends ConstraintValidator
{
    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof FrenchPhoneNumber) {
            throw new UnexpectedTypeException($constraint, FrenchPhoneNumber::class);
        }

        // Le champ est partout optionnel : l'absence de valeur n'est pas un
        // format invalide, c'est une absence de réponse.
        if ($value === null || $value === '') {
            return;
        }

        if (!\is_string($value)) {
            throw new UnexpectedValueException($value, 'string');
        }

        if (preg_match(FrenchPhoneNumber::PATTERN, $value) === 1) {
            return;
        }

        $this->context->buildViolation($constraint->message)
            ->setParameter('{{ value }}', $this->formatValue($value))
            ->addViolation();
    }
}
