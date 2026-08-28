<?php

declare(strict_types=1);

namespace App\Entity\User;

use App\Doctrine\UuidV7Generator;
use App\Enum\User\UserStatus;
use App\Repository\User\UserRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'app_user')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidV7Generator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(name: 'email', length: 180, unique: true)]
    private string $email;

    #[ORM\Column(name: 'roles', type: 'json')]
    private array $roles = [];

    #[ORM\Column(name: 'password', length: 255)]
    private string $password;

    #[ORM\Column(name: 'first_name', length: 100)]
    private string $firstName;

    #[ORM\Column(name: 'last_name', length: 100, nullable: true)]
    private ?string $lastName = null;

    #[ORM\Column(
        name: 'status',
        type: 'string',
        length: 20,
        nullable: false,
        enumType: UserStatus::class,
        options: ['default' => 'pending'],
    )]
    private UserStatus $status = UserStatus::Pending;

    /**
     * Opt-out global de la personne : elle ne veut plus recevoir de campagne email.
     *
     * Porté par User et non par Vendor parce que Vendor et Couple pointent tous deux
     * vers un User : le refus appartient à la personne, pas à sa casquette.
     *
     * Ne coupe que les campagnes (aujourd'hui la campagne de lancement WedDream),
     * jamais les emails transactionnels — réinitialisation de mot de passe,
     * invitation, rejet de candidature restent envoyés.
     *
     * TODO (WED-145) : flag global volontairement non normalisé. Le jour où des
     * préférences par type d'email sont cadrées (marketing / produit / transactionnel),
     * migrer vers une table dédiée. Pas avant — le besoin n'existe pas encore (YAGNI).
     */
    #[ORM\Column(name: 'unsubscribed_at', type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $unsubscribedAt = null;

    public function getId(): UuidV7
    {
        return $this->id;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function eraseCredentials(): void {}

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(?string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getStatus(): UserStatus
    {
        return $this->status;
    }

    public function setStatus(UserStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getUnsubscribedAt(): ?\DateTimeImmutable
    {
        return $this->unsubscribedAt;
    }

    public function setUnsubscribedAt(?\DateTimeImmutable $unsubscribedAt): static
    {
        $this->unsubscribedAt = $unsubscribedAt;

        return $this;
    }

}
