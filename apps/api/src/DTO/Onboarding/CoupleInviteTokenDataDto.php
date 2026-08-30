<?php

declare(strict_types=1);

namespace App\DTO\Onboarding;

use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Culture\Culture;
use App\Entity\Wedding\WeddingStyle;

final readonly class CoupleInviteTokenDataDto
{
    public array $data;

    public function __construct(Couple $couple)
    {
        $wedding = $couple->getWedding();

        $this->data = [
            'id'        => $couple->getId()->toRfc4122(),
            'status'    => $couple->getStatus()->value,
            'firstname' => $couple->getUser()->getFirstName(),
            'email'     => $couple->getUser()->getEmail(),
            'wedding'   => [
                'date'          => $wedding->getDate()->format('Y-m-d'),
                'budget_cents'  => $wedding->getBudgetCents(),
                'location'      => $wedding->getLocation(),
                'zone'          => $wedding->getZone()?->value,
                'guest_count'   => $wedding->getGuestCount(),
                'ambiance'      => $wedding->getAmbiance()?->value,
                'ceremony_type' => $wedding->getCeremonyType()?->value,
                'styles'        => array_map(
                    fn(WeddingStyle $s) => ['id' => $s->getId()->toRfc4122(), 'name' => $s->getName()],
                    $wedding->getStyles()->toArray()
                ),
                'cultures'      => array_map(
                    fn(Culture $c) => ['id' => $c->getId()->toRfc4122(), 'name' => $c->getName()],
                    $wedding->getCultures()->toArray()
                ),
                'confessions'   => array_map(
                    fn(Confession $c) => ['id' => $c->getId()->toRfc4122(), 'name' => $c->getName()],
                    $wedding->getConfessions()->toArray()
                ),
            ],
        ];
    }
}
