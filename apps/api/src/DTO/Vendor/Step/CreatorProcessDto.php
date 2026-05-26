<?php

declare(strict_types=1);

namespace App\DTO\Vendor\Step;

use App\DTO\DTOInterface;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreatorProcessDto implements DTOInterface
{
    public function __construct(
        #[Assert\NotNull(message: 'Le délai minimum est requis')]
        #[Assert\Choice(choices: [3, 6, 10, 12], message: 'Valeur de délai invalide')]
        public ?int $minLeadTimeMonths,

        #[Assert\NotNull(message: 'La capacité annuelle est requise')]
        #[Assert\Choice(choices: [5, 10, 20, 99], message: 'Valeur de capacité invalide')]
        public ?int $annualCapacity,

        #[Assert\NotNull(message: 'Le nombre de rendez-vous est requis')]
        #[Assert\Choice(choices: [1, 2, 3, 4], message: 'Valeur de rendez-vous invalide')]
        public ?int $rdvCount,

        #[Assert\NotNull(message: 'La durée du premier rendez-vous est requise')]
        #[Assert\Choice(choices: [30, 60, 90, 120], message: 'Valeur de durée invalide')]
        public ?int $firstRdvDurationMinutes,
    ) {}

    public static function fromArray(array $data): static
    {
        return new self(
            minLeadTimeMonths:       array_key_exists('min_lead_time_months', $data)        ? $data['min_lead_time_months']        : null,
            annualCapacity:          array_key_exists('annual_capacity', $data)             ? $data['annual_capacity']             : null,
            rdvCount:                array_key_exists('rdv_count', $data)                   ? $data['rdv_count']                   : null,
            firstRdvDurationMinutes: array_key_exists('first_rdv_duration_minutes', $data)  ? $data['first_rdv_duration_minutes']  : null,
        );
    }
}
