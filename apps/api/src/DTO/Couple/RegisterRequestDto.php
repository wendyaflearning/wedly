<?php

declare(strict_types=1);

namespace App\DTO\Couple;

use App\Entity\ProviderLead\ProviderLead;
use App\Enum\Couple\PlanningStage;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * The single payload of the couple onboarding: screens 1 to 7 are held in the
 * browser and submitted at once (COUPLE-ONBOARDING-001). That state lives in a
 * sessionStorage the couple can rewrite, so every field is constrained here even
 * when a control already bounds it on screen — the frontend guards are there for
 * the couple, this DTO is there for the database.
 *
 * Its job is to turn what would be a 500 at insert time — a NOT NULL column left
 * empty, an amount past the `integer` ceiling — into a 422 the screen can show.
 *
 * It carries no `DTOInterface::fromArray()`: that interface belongs to the
 * handler-driven DTOs, while this one is hydrated by `#[MapRequestPayload]` the
 * way `RejectVendorRequestDto` is.
 */
final readonly class RegisterRequestDto
{
    public const GUEST_COUNT_MIN = 20;
    public const GUEST_COUNT_MAX = 300;

    public function __construct(
        #[Assert\NotBlank(message: 'Renseignez votre adresse email.')]
        #[Assert\Email(message: 'Cette adresse email n’est pas valide.')]
        #[Assert\Length(max: 180)]
        public string $email = '',

        #[Assert\NotBlank(message: 'Renseignez un mot de passe.')]
        #[Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.')]
        public string $password = '',

        #[Assert\EqualTo(propertyPath: 'password', message: 'Les mots de passe ne correspondent pas.')]
        public string $passwordConfirmation = '',

        #[Assert\NotBlank(message: 'Renseignez votre prénom.', normalizer: 'trim')]
        #[Assert\Length(max: 100)]
        public string $firstName = '',

        #[Assert\NotNull(message: 'Indiquez où vous en êtes dans votre organisation.')]
        #[Assert\Choice(callback: [PlanningStage::class, 'values'], message: 'Cet avancement n’existe pas.')]
        public ?string $planningStage = null,

        /**
         * `wedding.date` is NOT NULL and the journey blocks screen 2 on it since
         * 23/08/2026. The floor repeats COUPLE-ONBOARDING-004, which until now
         * only existed in the screen-2 calendar.
         */
        #[Assert\NotNull(message: 'Choisissez la date de votre mariage.')]
        #[Assert\GreaterThanOrEqual('today', message: 'La date du mariage ne peut pas être dans le passé.')]
        public ?\DateTimeImmutable $weddingDate = null,

        #[Assert\NotBlank(message: 'Indiquez où vous souhaitez vous marier.', normalizer: 'trim')]
        #[Assert\Length(max: 255)]
        public string $location = '',

        #[Assert\NotNull]
        #[Assert\Range(
            min: 0,
            max: ProviderLead::MAX_BUDGET_CENTS,
            notInRangeMessage: 'Ce budget est hors des montants acceptés.',
        )]
        public ?int $budgetCents = null,

        #[Assert\NotNull]
        #[Assert\Range(
            min: self::GUEST_COUNT_MIN,
            max: self::GUEST_COUNT_MAX,
            notInRangeMessage: 'Le nombre d’invités doit être compris entre {{ min }} et {{ max }}.',
        )]
        public ?int $guestCount = null,

        public bool $sensitiveDataConsent = false,

        /** @var string[] */
        #[Assert\All([new Assert\Type('string'), new Assert\Length(max: 100)])]
        public array $confessionSlugs = [],

        /** @var string[] */
        #[Assert\All([new Assert\Type('string'), new Assert\Length(max: 100)])]
        public array $cultureSlugs = [],

        /**
         * Set only when the journey started on « Je veux entrer en contact »
         * (WED-49). A pin never carries it, and a couple without it never
         * produces a lead (PROVIDER-LEAD-001).
         */
        #[Assert\Uuid(message: 'Ce prestataire n’existe pas.')]
        public ?string $vendorId = null,
    ) {}

    public function planningStage(): PlanningStage
    {
        return PlanningStage::from((string) $this->planningStage);
    }
}
