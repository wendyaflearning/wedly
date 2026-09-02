<?php

declare(strict_types=1);

namespace App\Tests\Unit\Assembler\Vendor\ProviderLead;

use App\Assembler\Vendor\ProviderLead\VendorProviderLeadResponseDtoAssembler;
use App\DTO\Vendor\ProviderLead\MaskedVendorProviderLeadResponseDto;
use App\DTO\Vendor\ProviderLead\UnlockedVendorProviderLeadResponseDto;
use App\Entity\Couple\Couple;
use App\Entity\ProviderLead\ProviderLead;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\TagType;
use App\Entity\Vendor\TagValue;
use App\Entity\Vendor\Vendor;
use App\Entity\Wedding\Wedding;
use App\Enum\Couple\PlanningStage;
use App\Enum\ProviderLead\ProviderLeadStatus;
use App\Enum\Vendor\VendorType;
use App\Service\ProviderLead\ProviderLeadCategoryResolver;
use App\Service\ProviderLead\ProviderLeadSpecialtyTagsResolver;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

/**
 * Le critère d'acceptance du ticket est une règle de confidentialité : le
 * prestataire ne lit les coordonnées du couple qu'après avoir accepté, et ne lit
 * jamais culture ni confession. Ce test vérifie la seule chose qui la garantit —
 * la *forme* des deux DTOs, pas une condition posée ailleurs.
 */
final class VendorProviderLeadResponseDtoAssemblerTest extends TestCase
{
    /** Les clés qu'aucune des deux formes ne doit porter (RGPD Article 9). */
    private const NEVER = ['culture', 'cultures', 'confession', 'confessions'];

    private VendorProviderLeadResponseDtoAssembler $assembler;

    protected function setUp(): void
    {
        $this->assembler = new VendorProviderLeadResponseDtoAssembler(
            new ProviderLeadCategoryResolver(),
            new ProviderLeadSpecialtyTagsResolver(),
        );
    }

    public function testAPendingLeadIsMasked(): void
    {
        $dto = $this->assembler->assemble($this->lead(ProviderLeadStatus::Pending));

        self::assertInstanceOf(MaskedVendorProviderLeadResponseDto::class, $dto);
        self::assertSame('pending', $dto->status);
    }

    /**
     * Le cœur de la règle : aucune propriété de la forme masquée ne peut porter
     * les coordonnées, donc aucune régression ne peut les y faire apparaître.
     */
    public function testTheMaskedShapeHasNoContactPropertyAtAll(): void
    {
        $keys = $this->keysOf($this->assembler->assemble($this->lead(ProviderLeadStatus::Pending)));

        foreach (['lastName', 'email', 'phone'] as $forbidden) {
            self::assertNotContains($forbidden, $keys, sprintf(
                'La demande masquée ne doit pas exposer « %s ».',
                $forbidden,
            ));
        }
    }

    public function testAnAcceptedLeadRevealsTheCoupleContactDetails(): void
    {
        $dto = $this->assembler->assemble($this->lead(ProviderLeadStatus::Accepted));

        self::assertInstanceOf(UnlockedVendorProviderLeadResponseDto::class, $dto);
        self::assertSame('accepted', $dto->status);
        self::assertSame('Dupont', $dto->lastName);
        self::assertSame('camille@example.test', $dto->email);
        self::assertSame('0612345678', $dto->phone);
    }

    /**
     * Un refus ne dévoile rien : le prestataire a dit non, la demande retombe
     * dans la forme masquée.
     */
    public function testARefusedLeadStaysMasked(): void
    {
        $dto = $this->assembler->assemble($this->lead(ProviderLeadStatus::Refused));

        self::assertInstanceOf(MaskedVendorProviderLeadResponseDto::class, $dto);
        self::assertSame('refused', $dto->status);
    }

    /**
     * Les deux côtés lisent la même liste blanche (`CoupleLeadStatus`). Si elles
     * divergeaient, un lead historique s'afficherait débloqué chez le couple et
     * masqué chez le prestataire, pour la même ligne en base.
     */
    public function testTheUnlockedWhitelistMatchesTheCoupleSide(): void
    {
        foreach ([ProviderLeadStatus::Confirmed, ProviderLeadStatus::Contacted] as $status) {
            self::assertInstanceOf(
                UnlockedVendorProviderLeadResponseDto::class,
                $this->assembler->assemble($this->lead($status)),
                sprintf('« %s » vaut acceptation côté couple, il doit valoir acceptation ici.', $status->value),
            );
        }

        foreach ([ProviderLeadStatus::Pending, ProviderLeadStatus::Closed, ProviderLeadStatus::Unavailable] as $status) {
            self::assertInstanceOf(
                MaskedVendorProviderLeadResponseDto::class,
                $this->assembler->assemble($this->lead($status)),
                sprintf('« %s » n\'exprime aucune acceptation, il doit rester masqué.', $status->value),
            );
        }
    }

    /**
     * Ni avant ni après acceptation : ces données sont réservées à WedMatch, et
     * une décision favorable ne les débloque pas davantage.
     */
    public function testNeitherShapeCarriesCultureOrConfession(): void
    {
        foreach ([ProviderLeadStatus::Pending, ProviderLeadStatus::Accepted] as $status) {
            $keys = array_map('strtolower', $this->keysOf($this->assembler->assemble($this->lead($status))));

            foreach (self::NEVER as $forbidden) {
                self::assertNotContains($forbidden, $keys, sprintf(
                    'Statut « %s » : la clé « %s » n\'a rien à faire côté prestataire.',
                    $status->value,
                    $forbidden,
                ));
            }
        }
    }

    public function testItCarriesTheProjectBrief(): void
    {
        $dto = $this->assembler->assemble($this->lead(ProviderLeadStatus::Pending));

        self::assertSame('Camille', $dto->firstName);
        self::assertSame('2027-06-12', $dto->weddingDate);
        self::assertSame(120, $dto->guestCount);
        self::assertSame('Photographe', $dto->category);
        self::assertSame(['Bohème'], $dto->specialtyTags);
    }

    /**
     * Le budget est celui figé sur le lead (PROVIDER-LEAD-002), pas celui que le
     * mariage porte aujourd'hui : une révision de budget ne doit pas réécrire
     * une demande déjà transmise.
     */
    public function testTheBudgetIsTheOneFrozenOnTheLeadNotTheCurrentWeddingBudget(): void
    {
        $lead = $this->lead(ProviderLeadStatus::Pending);
        $lead->getCouple()->getWedding()->setBudgetCents(9_999_999);

        self::assertSame(2_350_000, $this->assembler->assemble($lead)->weddingBudgetCents);
    }

    /**
     * Le téléphone est optionnel à l'inscription (WED-216) : un couple qui n'en
     * a jamais renseigné ne doit pas casser la lecture.
     */
    public function testAnAcceptedLeadWithoutAPhoneNumberIsStillReadable(): void
    {
        $lead = $this->lead(ProviderLeadStatus::Accepted);
        $lead->getCouple()->setPhone(null);

        $dto = $this->assembler->assemble($lead);

        self::assertInstanceOf(UnlockedVendorProviderLeadResponseDto::class, $dto);
        self::assertNull($dto->phone);
    }

    /**
     * @return string[]
     */
    private function keysOf(object $dto): array
    {
        return array_keys(get_object_vars($dto));
    }

    private function lead(ProviderLeadStatus $status): ProviderLead
    {
        $vendor = new Vendor();
        $lead   = new ProviderLead($this->couple(), $vendor, 2_350_000, $this->crushPhoto($vendor));

        // L'identifiant et l'horodatage sont posés par Doctrine au flush ; un
        // test unitaire ne passe pas par là.
        $reflection = new \ReflectionClass($lead);
        $reflection->getProperty('id')->setValue($lead, UuidV7::fromString('0198f0a1-0000-7000-8000-000000000001'));
        $reflection->getProperty('createdAt')->setValue($lead, new \DateTimeImmutable('2026-08-28T09:00:00+00:00'));

        return $lead->setStatus($status);
    }

    private function couple(): Couple
    {
        $user = (new User())
            ->setFirstName('Camille')
            ->setLastName('Dupont')
            ->setEmail('camille@example.test');

        $wedding = (new Wedding())
            ->setDate(new \DateTimeImmutable('2027-06-12'))
            ->setLocation('Lyon')
            ->setBudgetCents(2_350_000)
            ->setGuestCount(120);

        return (new Couple())
            ->setUser($user)
            ->setWedding($wedding)
            ->setPlanningStage(PlanningStage::JustStarted)
            ->setPhone('0612345678');
    }

    private function crushPhoto(Vendor $vendor): PortfolioImage
    {
        $service = (new Service())
            ->setName('Photographe')
            ->setSlug('photographe')
            ->setSortOrder(0)
            ->setCategory(VendorType::Freelance);

        return (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl('https://res.cloudinary.com/wedly/image/upload/v1/coup-de-coeur.jpg')
            ->setSortOrder(0)
            ->addTag($this->tag($service, 'Photographe', isPrimary: true))
            ->addTag($this->tag($service, 'Bohème', isPrimary: false));
    }

    private function tag(Service $service, string $label, bool $isPrimary): TagValue
    {
        $tagType = (new TagType())
            ->setService($service)
            ->setLabel('Type')
            ->setIsPrimary($isPrimary);

        return (new TagValue())->setTagType($tagType)->setLabel($label);
    }
}
