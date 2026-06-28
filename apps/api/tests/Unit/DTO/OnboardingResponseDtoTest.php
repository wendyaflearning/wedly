<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO;

use App\DTO\Onboarding\CoupleInviteTokenDataDto;
use App\DTO\Onboarding\InviteTokenResponseDto;
use App\DTO\Onboarding\VendorInviteTokenDataDto;
use App\DTO\Vendor\Onboarding\Response\OnboardingCateringDetailsResponse;
use App\DTO\Vendor\Onboarding\Response\OnboardingDataResponse;
use App\DTO\Vendor\Onboarding\Response\OnboardingOverviewResponseDto;
use App\DTO\Vendor\Onboarding\Response\OnboardingStepResponse;
use App\DTO\Vendor\Onboarding\Response\OnboardingVenueDetailsResponse;
use App\Entity\Confession\Confession;
use App\Entity\Couple\Couple;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Entity\Vendor\VendorVenueDetails;
use App\Entity\Wedding\Wedding;
use App\Entity\Wedding\WeddingStyle;
use App\Enum\Couple\CoupleStatus;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorType;
use App\Enum\Vendor\VenueType;
use App\Enum\Vendor\Zone;
use App\Enum\Wedding\Ambiance;
use App\Enum\Wedding\CeremonyType;
use App\Enum\Wedding\CultureType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class OnboardingResponseDtoTest extends TestCase
{
    public function test_vendor_invite_token_data_contains_vendor_snapshot(): void
    {
        $vendor = $this->vendorWithRelations();

        $dto = new VendorInviteTokenDataDto($vendor);

        $this->assertSame('Studio Lumiere', $dto->data['brand_name']);
        $this->assertSame('Camille', $dto->data['firstname']);
        $this->assertSame('camille@example.com', $dto->data['email']);
        $this->assertSame('per_service', $dto->data['price_type']);
        $this->assertSame('Photographe', $dto->data['services'][0]['name']);
        $this->assertSame('Ile-de-France', $dto->data['regions'][0]['name']);
        $this->assertSame('Boheme', $dto->data['styles'][0]['name']);
        $this->assertSame('France', $dto->data['cultures'][0]['name']);
        $this->assertSame('Laic', $dto->data['confessions'][0]['name']);
        $this->assertSame('https://example.com/cover.jpg', $dto->data['portfolio_images'][0]['url']);
        $this->assertIsString($dto->data['id']);
    }

    public function test_couple_invite_token_data_contains_wedding_snapshot(): void
    {
        $couple = $this->coupleWithWedding();

        $dto = new CoupleInviteTokenDataDto($couple);

        $this->assertSame('active', $dto->data['status']);
        $this->assertSame('Alex', $dto->data['firstname']);
        $this->assertSame('alex@example.com', $dto->data['email']);
        $this->assertSame('2027-05-12', $dto->data['wedding']['date']);
        $this->assertSame(2500000, $dto->data['wedding']['budget_cents']);
        $this->assertSame('idf', $dto->data['wedding']['zone']);
        $this->assertSame('elegant_soigne', $dto->data['wedding']['ambiance']);
        $this->assertSame('laique', $dto->data['wedding']['ceremony_type']);
        $this->assertSame('Boheme', $dto->data['wedding']['styles'][0]['name']);
        $this->assertSame('France', $dto->data['wedding']['cultures'][0]['name']);
        $this->assertSame('Laic', $dto->data['wedding']['confessions'][0]['name']);
    }

    public function test_onboarding_data_response_maps_vendor_state_for_venue(): void
    {
        $vendor = $this->vendorWithRelations()
            ->setOnboardingStep(OnboardingStep::Portfolio)
            ->setVenueDetails(
                (new VendorVenueDetails())
                    ->setVenueType(VenueType::Domaine)
                    ->setCapacityMin(80)
                    ->setCapacityMax(180)
                    ->setHasCatering(true)
                    ->setHasAccommodation(false)
                    ->setHasOutdoorSpace(true)
                    ->setHasCorkageFee(false)
                    ->setHasToilets(true)
                    ->setIsPmrAccessible(true)
                    ->setNearestCity('Paris')
                    ->setDistanceToCityMinutes(30)
            );
        $vendor->getServices()->clear();
        $vendor->addService($this->serviceWithId('Lieu', 'lieu-de-reception', VendorType::Lieu));

        $response = OnboardingDataResponse::fromVendor($vendor);

        $this->assertSame('Camille', $response->firstname);
        $this->assertSame('portfolio', $response->onboarding_step);
        $this->assertSame('lieu', $response->vendor_category);
        $this->assertSame(['lieu-de-reception'], $response->services);
        $this->assertSame('https://example.com/cover.jpg', $response->portfolio['cover']);
        $this->assertSame(['https://example.com/secondary.jpg'], $response->portfolio['images']);
        $this->assertSame('Studio Lumiere', $response->legal['brand_name']);
        $this->assertInstanceOf(OnboardingVenueDetailsResponse::class, $response->venue_details);
        $this->assertNull($response->catering_details);
    }

    public function test_onboarding_data_response_maps_catering_details(): void
    {
        $vendor = $this->vendorWithRelations()
            ->setCateringDetails(
                (new VendorCateringDetails())
                    ->setCoversMin(40)
                    ->setCoversMax(160)
                    ->setIsKosher(false)
                    ->setIsHalal(true)
                    ->setIsVegan(true)
                    ->setIsGlutenFree(false)
                    ->setOffersTableService(true)
                    ->setOffersBuffet(false)
                    ->setOffersCocktail(true)
                    ->setProvidesTableware(true)
                    ->setProvidesFurniture(false)
            );
        $vendor->getServices()->clear();
        $vendor->addService($this->serviceWithId('Traiteur', 'traiteur', VendorType::Traiteur));

        $response = OnboardingDataResponse::fromVendor($vendor);

        $this->assertSame('traiteur', $response->vendor_category);
        $this->assertNull($response->venue_details);
        $this->assertInstanceOf(OnboardingCateringDetailsResponse::class, $response->catering_details);
        $this->assertSame(40, $response->catering_details->covers_min);
        $this->assertTrue($response->catering_details->is_halal);
    }

    public function test_simple_onboarding_response_dtos_keep_public_contract(): void
    {
        $step = new OnboardingStepResponse('professions', 'Vos services', 1, 'current', false);
        $overview = new OnboardingOverviewResponseDto('Camille', 'freelance', [$step], ['professions' => []]);
        $invite = new InviteTokenResponseDto('vendor', ['id' => 'vendor-id']);

        $this->assertSame('professions', $overview->steps[0]->stepKey);
        $this->assertSame('vendor', $invite->type);
        $this->assertSame(['id' => 'vendor-id'], $invite->data);
    }

    private function vendorWithRelations(): Vendor
    {
        $user = $this->user('Camille', 'camille@example.com');
        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName('Studio Lumiere')
            ->setDescription('Photographe de mariage')
            ->setSiret('12345678901234')
            ->setAddress('12 rue de la Paix')
            ->setZipcode('75001')
            ->setCity('Paris')
            ->setPhone('0612345678')
            ->setLegalName('Studio Lumiere SAS')
            ->setLegalForm('SAS')
            ->setLegalStatus('Actif')
            ->setSiretVerified(true)
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(120000)
            ->setPriceMaxCents(250000)
            ->addService($this->serviceWithId('Photographe', 'photographe', VendorType::Freelance))
            ->addRegion($this->withId((new Region())->setName('Ile-de-France')->setSlug('ile-de-france')))
            ->addStyle($this->withId((new WeddingStyle())->setName('Boheme')->setSlug('boheme')))
            ->addCulture($this->cultureWithId('France', 'france'))
            ->addConfession($this->confessionWithId('Laic', 'laic'));

        $this->withId($vendor);
        $vendor->getPortfolioImages()->add(
            $this->withId(
                (new PortfolioImage())
                    ->setVendor($vendor)
                    ->setUrl('https://example.com/cover.jpg')
                    ->setSortOrder(0)
                    ->setIsCover(true)
            )
        );
        $vendor->getPortfolioImages()->add(
            $this->withId(
                (new PortfolioImage())
                    ->setVendor($vendor)
                    ->setUrl('https://example.com/secondary.jpg')
                    ->setSortOrder(1)
                    ->setIsCover(false)
            )
        );

        return $vendor;
    }

    private function coupleWithWedding(): Couple
    {
        $wedding = (new Wedding())
            ->setDate(new \DateTimeImmutable('2027-05-12'))
            ->setBudgetCents(2500000)
            ->setLocation('Paris')
            ->setZone(Zone::Idf)
            ->setGuestCount(120)
            ->setAmbiance(Ambiance::ElegantSoigne)
            ->setCeremonyType(CeremonyType::Laique)
            ->addStyle($this->withId((new WeddingStyle())->setName('Boheme')->setSlug('boheme')))
            ->addCulture($this->cultureWithId('France', 'france'))
            ->addConfession($this->confessionWithId('Laic', 'laic'));

        $couple = (new Couple())
            ->setUser($this->user('Alex', 'alex@example.com'))
            ->setWedding($wedding)
            ->setStatus(CoupleStatus::Active);

        return $this->withId($couple);
    }

    private function serviceWithId(string $name, string $slug, VendorType $category): Service
    {
        return $this->withId((new Service())->setName($name)->setSlug($slug)->setSortOrder(1)->setCategory($category));
    }

    private function cultureWithId(string $name, string $slug): Culture
    {
        return $this->withId((new Culture())->setName($name)->setSlug($slug)->setType(CultureType::Country));
    }

    private function confessionWithId(string $name, string $slug): Confession
    {
        return $this->withId((new Confession())->setName($name)->setSlug($slug));
    }

    private function user(string $firstName, string $email): User
    {
        return $this->withId((new User())->setFirstName($firstName)->setEmail($email));
    }

    /** @template T of object @param T $entity @return T */
    private function withId(object $entity): object
    {
        $id = new \ReflectionProperty($entity, 'id');
        $id->setValue($entity, new UuidV7());

        return $entity;
    }
}
