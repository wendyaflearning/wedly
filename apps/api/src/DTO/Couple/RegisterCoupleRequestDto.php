<?php

declare(strict_types=1);

namespace App\DTO\Couple;

use App\Entity\ProviderLead\ProviderLead;
use App\Enum\Couple\PlanningStage;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Payload unique de l'écran 7. Les écrans 1 à 6 ne persistent rien
 * (COUPLE-ONBOARDING-001) : tout ce que le parcours a collecté arrive ici en
 * une fois.
 *
 * Cet état a transité par le sessionStorage du navigateur, donc par une source
 * réinscriptible : chaque borne déjà appliquée côté frontend est réappliquée
 * ici. Un champ manquant ou mal typé est refusé en 422 par MapRequestPayload,
 * jamais en 500 à l'insertion.
 */
final readonly class RegisterCoupleRequestDto
{
    /**
     * @param string[] $confessionSlugs
     * @param string[] $cultureSlugs
     */
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email]
        public string $email,

        // Longueur alignée sur PostResetPasswordAction, seul autre endroit du
        // projet où un couple choisit son mot de passe.
        #[Assert\NotBlank]
        #[Assert\Length(min: 8)]
        public string $password,

        #[Assert\NotBlank]
        #[Assert\EqualTo(propertyPath: 'password', message: 'Les mots de passe ne correspondent pas.')]
        public string $passwordConfirmation,

        // normalizer: NotBlank laisse passer une chaîne d'espaces par défaut,
        // qui remplirait une colonne NOT NULL sans rien y mettre de réel.
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 100)]
        public string $firstName,

        public PlanningStage $planningStage,

        // COUPLE-ONBOARDING-004 : une date passée n'a aucun sens pour un mariage
        // à organiser et polluerait Wedmatch. Cette borne n'existait jusqu'ici
        // que dans le calendrier frontend.
        #[Assert\GreaterThanOrEqual('today', message: 'La date du mariage ne peut pas être dans le passé.')]
        public \DateTimeImmutable $weddingDate,

        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 255)]
        public string $location,

        // PROVIDER-LEAD-003 : borne identique à celle du constructeur de
        // ProviderLead, qui reste le dernier rempart.
        #[Assert\Range(min: 0, max: ProviderLead::MAX_BUDGET_CENTS)]
        public int $budgetCents,

        // COUPLE-ONBOARDING-005 : bornes du curseur de l'écran 2.
        #[Assert\Range(min: 20, max: 300)]
        public int $guestCount,

        public bool $sensitiveDataConsent,

        #[Assert\All([new Assert\NotBlank(), new Assert\Length(max: 100)])]
        public array $confessionSlugs = [],

        #[Assert\All([new Assert\NotBlank(), new Assert\Length(max: 100)])]
        public array $cultureSlugs = [],

        #[Assert\Valid]
        public ?ProviderContactRequestDto $contactRequest = null,
    ) {}
}
