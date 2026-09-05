<?php

declare(strict_types=1);

namespace App\Entity\Couple;

use App\Doctrine\UuidV7Generator;
use App\Entity\User\User;
use App\Entity\Wedding\Wedding;
use App\Enum\Couple\CoupleStatus;
use App\Enum\Couple\PlanningStage;
use App\Repository\Couple\CoupleRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: CoupleRepository::class)]
#[ORM\Table(name: 'couple')]
#[ORM\HasLifecycleCallbacks]
class Couple
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private UuidV7 $id;

    #[ORM\OneToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;

    #[ORM\OneToOne(targetEntity: Wedding::class)]
    #[ORM\JoinColumn(name: 'wedding_id', referencedColumnName: 'id', nullable: false)]
    private Wedding $wedding;

    #[ORM\Column(name: 'status', type: 'string', length: 20, enumType: CoupleStatus::class, options: ['default' => 'pending'])]
    private CoupleStatus $status = CoupleStatus::Pending;

    #[ORM\Column(name: 'planning_stage', type: 'string', length: 20, enumType: PlanningStage::class)]
    private PlanningStage $planningStage;

    // Optionnel : renseigné à l'écran 7 du parcours d'inscription (WED-216),
    // jamais exigé. Longueur alignée sur `Vendor::$phone`, l'autre téléphone du
    // projet.
    #[ORM\Column(name: 'phone', length: 20, nullable: true)]
    private ?string $phone = null;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getWedding(): Wedding
    {
        return $this->wedding;
    }

    public function setWedding(Wedding $wedding): static
    {
        $this->wedding = $wedding;

        return $this;
    }

    public function getStatus(): CoupleStatus
    {
        return $this->status;
    }

    public function setStatus(CoupleStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    /**
     * TODO WED-216 : le téléphone est aujourd'hui écrit sans être relu — aucun
     * endpoint ne l'expose. Dette assumée à l'ouverture du salon : à exposer via
     * `GET /couple/me` quand l'espace couple existera.
     */
    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;

        return $this;
    }

    public function getPlanningStage(): PlanningStage
    {
        return $this->planningStage;
    }

    public function setPlanningStage(PlanningStage $planningStage): static
    {
        $this->planningStage = $planningStage;

        return $this;
    }
}
