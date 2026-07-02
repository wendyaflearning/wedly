<?php

declare(strict_types=1);

namespace App\Tests\Unit\DTO\Admin\Vendor;

use App\DTO\Admin\Vendor\AdminVendorDraftListResponseDto;
use App\DTO\Admin\Vendor\AdminVendorDraftRequestDto;
use App\DTO\Admin\Vendor\AdminVendorDraftResponseDto;
use App\DTO\Admin\Vendor\AdminVendorInvitationListResponseDto;
use App\DTO\Admin\Vendor\AdminVendorInvitationResponseDto;
use App\DTO\Admin\Vendor\AdminVendorInvitationSendResponseDto;
use App\DTO\Admin\Vendor\AdminVendorListItemResponseDto;
use App\DTO\Admin\Vendor\AdminVendorListResponseDto;
use App\DTO\Admin\Vendor\AdminVendorProfileResponseDto;
use App\DTO\Admin\Vendor\RejectVendorRequestDto;
use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Region\Region;
use App\Entity\User\InviteToken;
use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Entity\Vendor\VendorCateringDetails;
use App\Entity\Vendor\VendorVenueDetails;
use App\Enum\User\InviteTokenPersona;
use App\Enum\User\InviteTokenStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorRejectionReason;
use App\Enum\Vendor\VendorStatus;
use App\Enum\Vendor\VendorType;
use App\Enum\Vendor\VenueType;
use App\Enum\Wedding\CultureType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;

final class AdminVendorDtoTest extends TestCase
{
    public function test_draft_request_from_array_normalizes_values(): void
    {
        $dto = AdminVendorDraftRequestDto::fromArray([
            'firstname' => ' Camille ',
            'last_name' => '',
            'email' => ' camille@example.fr ',
            'brand_name' => ' Studio Camille ',
            'service_id' => 'service-id',
            'regions' => ['region-id'],
            'price_min' => '100',
            'price_max' => '',
            'price_type' => 'per_service',
            'experiences' => ['culture_ids' => ['culture-id']],
            'legal_info' => ['city' => 'Paris'],
            'venue_characteristics' => ['capacity_min' => '80'],
            'catering_characteristics' => ['covers_min' => '50'],
        ]);

        $this->assertSame('Camille', $dto->firstname);
        $this->assertNull($dto->lastName);
        $this->assertSame('camille@example.fr', $dto->email);
        $this->assertSame(100, $dto->priceMin);
        $this->assertNull($dto->priceMax);
        $this->assertSame(['region-id'], $dto->regions);
        $this->assertSame(['city' => 'Paris'], $dto->legalInfo);
    }

    public function test_list_item_and_list_dtos_map_vendor_summary(): void
    {
        $vendor = $this->vendor(VendorType::Freelance)
            ->setStatus(VendorStatus::UnderReview)
            ->setSubmittedForReviewAt(new \DateTimeImmutable('2026-07-01 10:00:00'));

        $item = new AdminVendorListItemResponseDto($vendor);
        $list = new AdminVendorListResponseDto([$vendor], totalAll: 5);
        $draftList = new AdminVendorDraftListResponseDto([$vendor]);

        $this->assertSame('Studio Camille', $item->name);
        $this->assertSame('freelance', $item->vendorType);
        $this->assertSame('Freelance', $item->vendorTypeLabel);
        $this->assertSame(['Photographe'], $item->services);
        $this->assertSame('under_review', $item->status);
        $this->assertSame('En attente', $item->statusLabel);
        $this->assertCount(1, $list->items);
        $this->assertSame(5, $list->totalAll);
        $this->assertSame(1, $list->totalFiltered);
        $this->assertCount(1, $draftList->items);
        $this->assertSame(1, $draftList->total);
    }

    public function test_static_labels_cover_all_vendor_types_and_statuses(): void
    {
        $this->assertSame('Créateur', AdminVendorListItemResponseDto::vendorTypeLabel(VendorType::Createurs));
        $this->assertSame('Traiteur', AdminVendorListItemResponseDto::vendorTypeLabel(VendorType::Traiteur));
        $this->assertSame('Lieu', AdminVendorListItemResponseDto::vendorTypeLabel(VendorType::Lieu));
        $this->assertSame('Validé', AdminVendorListItemResponseDto::statusLabel(VendorStatus::Active));
        $this->assertSame('Refusé', AdminVendorListItemResponseDto::statusLabel(VendorStatus::Rejected));
        $this->assertSame('En attente', AdminVendorListItemResponseDto::statusLabel(VendorStatus::Pending));
    }

    public function test_profile_response_maps_venue_profile_with_relations_and_sorted_portfolio(): void
    {
        $vendor = $this->vendor(VendorType::Lieu)
            ->setStatus(VendorStatus::Active)
            ->setDescription(null)
            ->setBio('Bio fallback')
            ->setSubmittedForReviewAt(new \DateTimeImmutable('2026-07-01 10:00:00'))
            ->setReviewedAt(new \DateTimeImmutable('2026-07-02 12:00:00'));
        $vendor->setVenueDetails(
            (new VendorVenueDetails())
                ->setVendor($vendor)
                ->setVenueType(VenueType::Chateau)
                ->setCapacityMin(80)
                ->setCapacityMax(180)
                ->setNearestCity('Paris')
                ->setDistanceToCityMinutes(30)
                ->setHasCatering(true)
                ->setHasAccommodation(false)
                ->setHasOutdoorSpace(true)
                ->setHasCorkageFee(false)
                ->setHasToilets(true)
                ->setIsPmrAccessible(true)
        );

        $response = new AdminVendorProfileResponseDto($vendor);

        $this->assertSame('active', $response->status);
        $this->assertSame('Validé', $response->statusLabel);
        $this->assertSame('lieu', $response->vendorType);
        $this->assertSame('Lieu', $response->vendorTypeLabel);
        $this->assertSame('Camille', $response->summary['firstName']);
        $this->assertSame('Bio fallback', $response->profession['description']);
        $this->assertSame('Lieu', $response->profession['services'][0]['name']);
        $this->assertSame('France', $response->experiences['cultures'][0]['name']);
        $this->assertSame('Laic', $response->experiences['confessions'][0]['name']);
        $this->assertSame('Île-de-France', $response->zonesPricing['regions'][0]['name']);
        $this->assertSame('Par prestation', $response->zonesPricing['priceTypeLabel']);
        $this->assertSame('https://example.com/first.jpg', $response->portfolio[0]['url']);
        $this->assertTrue($response->portfolio[1]['isCover']);
        $this->assertSame('2020-01-01', $response->legal['incorporatedAt']);
        $this->assertSame('venue', $response->specificDetails['type']);
        $this->assertSame('chateau', $response->specificDetails['details']['venueType']);
        $this->assertNull($response->rejection);
    }

    public function test_profile_response_maps_catering_details_rejection_and_freelance_specific_details(): void
    {
        $vendor = $this->vendor(VendorType::Traiteur)
            ->setStatus(VendorStatus::Rejected)
            ->setPriceType(PriceType::PerPerson)
            ->setRejectionReasons([VendorRejectionReason::PortfolioQuality->value, 'custom_reason'])
            ->setRejectionNote('Images trop sombres.')
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

        $response = new AdminVendorProfileResponseDto($vendor);
        $freelanceResponse = new AdminVendorProfileResponseDto($this->vendor(VendorType::Freelance));

        $this->assertSame('Traiteur', $response->vendorTypeLabel);
        $this->assertSame('Par personne', $response->zonesPricing['priceTypeLabel']);
        $this->assertSame('catering', $response->specificDetails['type']);
        $this->assertSame(40, $response->specificDetails['details']['coversMin']);
        $this->assertTrue($response->specificDetails['details']['isHalal']);
        $this->assertSame(VendorRejectionReason::PortfolioQuality->label(), $response->rejection['reasons'][0]['label']);
        $this->assertSame('custom_reason', $response->rejection['reasons'][1]['label']);
        $this->assertSame('Images trop sombres.', $response->rejection['note']);
        $this->assertNull($freelanceResponse->specificDetails);
    }

    public function test_draft_response_maps_invitation_and_optional_details(): void
    {
        $vendor = $this->vendor(VendorType::Lieu);
        $inviteToken = $this->inviteToken($vendor);

        $response = new AdminVendorDraftResponseDto($vendor, $inviteToken);
        $emptyVendor = $this->vendorWithoutService();
        $emptyResponse = new AdminVendorDraftResponseDto($emptyVendor);

        $this->assertSame('pending', $response->status);
        $this->assertSame('invite-token', $response->invitation['token']);
        $this->assertSame('Studio Camille', $response->identity['brandName']);
        $this->assertNotNull($response->profession['serviceId']);
        $this->assertSame([($vendor->getCultures()->first())->getId()->toRfc4122()], $response->experiences['cultureIds']);
        $this->assertSame('Paris', $response->zonesPricing['city']);
        $this->assertSame('12345678901234', $response->legalInfo['siret']);
        $this->assertNull($emptyResponse->profession['serviceId']);
        $this->assertNull($emptyResponse->invitation);
        $this->assertNull($emptyResponse->venueCharacteristics);
        $this->assertNull($emptyResponse->cateringCharacteristics);
    }

    public function test_invitation_response_and_list_map_vendor_invitation(): void
    {
        $vendor = $this->vendor(VendorType::Freelance);
        $inviteToken = $this->inviteToken($vendor);

        $response = new AdminVendorInvitationResponseDto($inviteToken);
        $list = new AdminVendorInvitationListResponseDto([$inviteToken]);
        $sendResponse = new AdminVendorInvitationSendResponseDto($vendor, $inviteToken, 'https://app.wedly.test/', true);

        $this->assertSame('invite-token', $response->token);
        $this->assertSame('Studio Camille', $response->brandName);
        $this->assertSame('Camille', $response->firstname);
        $this->assertSame('Photographe', $response->service['name']);
        $this->assertSame('Île-de-France', $response->regions[0]['name']);
        $this->assertCount(1, $list->items);
        $this->assertSame(1, $list->total);
        $this->assertSame('invite-token', $sendResponse->inviteToken);
        $this->assertSame('https://app.wedly.test/onboarding/invite-token', $sendResponse->invitationUrl);
        $this->assertTrue($sendResponse->emailSent);
    }

    public function test_invitation_response_rejects_missing_vendor_or_user_and_defaults_missing_service(): void
    {
        $tokenWithoutVendor = $this->baseInviteToken()->setUser(new User());

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Invitation vendor missing vendor.');
        new AdminVendorInvitationResponseDto($tokenWithoutVendor);
    }

    public function test_invitation_response_rejects_missing_user(): void
    {
        $tokenWithoutUser = $this->baseInviteToken()->setVendor(new Vendor());

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Invitation vendor missing user.');
        new AdminVendorInvitationResponseDto($tokenWithoutUser);
    }

    public function test_invitation_response_defaults_missing_service(): void
    {
        $vendor = $this->vendorWithoutService();
        $token = $this->baseInviteToken()
            ->setVendor($vendor)
            ->setUser($vendor->getUser());

        $response = new AdminVendorInvitationResponseDto($token);

        $this->assertSame(['id' => null, 'name' => 'Non renseigné'], $response->service);
    }

    public function test_reject_vendor_request_keeps_reasons_and_note(): void
    {
        $dto = new RejectVendorRequestDto(['other'], 'À préciser');

        $this->assertSame(['other'], $dto->reasons);
        $this->assertSame('À préciser', $dto->note);
    }

    private function vendor(VendorType $type): Vendor
    {
        $user = $this->withTimestamps(
            $this->withId(
                (new User())
                    ->setFirstName('Camille')
                    ->setLastName('Martin')
                    ->setEmail('camille@example.fr')
                    ->setPassword('hashed')
            )
        );
        $service = $this->service($type);
        $region = $this->withId((new Region())->setName('Île-de-France')->setSlug('ile-de-france'));
        $culture = $this->withId((new Culture())->setName('France')->setSlug('france')->setType(CultureType::Country));
        $confession = $this->withId((new Confession())->setName('Laic')->setSlug('laic'));

        $vendor = $this->withTimestamps(
            $this->withId(
                (new Vendor())
                    ->setUser($user)
                    ->setBrandName('Studio Camille')
                    ->setDescription('Photographie de mariage')
                    ->setSiret('12345678901234')
                    ->setAddress('12 rue de la Paix')
                    ->setZipcode('75001')
                    ->setCity('Paris')
                    ->setPhone('0612345678')
                    ->setLegalName('Studio Camille SAS')
                    ->setLegalForm('SAS')
                    ->setLegalStatus('Actif')
                    ->setIncorporatedAt(new \DateTimeImmutable('2020-01-01'))
                    ->setSiretVerified(true)
                    ->setPriceType(PriceType::PerService)
                    ->setPriceMinCents(100000)
                    ->setPriceMaxCents(250000)
                    ->setStatus(VendorStatus::Pending)
                    ->addService($service)
                    ->addRegion($region)
                    ->addCulture($culture)
                    ->addConfession($confession)
            )
        );

        $vendor->getPortfolioImages()->add(
            $this->withId(
                (new PortfolioImage())
                    ->setVendor($vendor)
                    ->setUrl('https://example.com/cover.jpg')
                    ->setSortOrder(2)
                    ->setIsCover(true)
            )
        );
        $vendor->getPortfolioImages()->add(
            $this->withId(
                (new PortfolioImage())
                    ->setVendor($vendor)
                    ->setUrl('https://example.com/first.jpg')
                    ->setSortOrder(1)
                    ->setIsCover(false)
            )
        );

        return $vendor;
    }

    private function vendorWithoutService(): Vendor
    {
        return $this->withTimestamps(
            $this->withId(
                (new Vendor())
                    ->setUser($this->withId((new User())->setFirstName('Alex')->setEmail('alex@example.fr')->setPassword('hashed')))
                    ->setBrandName('Vendor without service')
                    ->setPriceType(PriceType::PerHour)
                    ->setPriceMinCents(100)
                    ->setPriceMaxCents(200)
            )
        );
    }

    private function service(VendorType $type): Service
    {
        $name = match ($type) {
            VendorType::Lieu => 'Lieu',
            VendorType::Traiteur => 'Traiteur',
            VendorType::Createurs => 'Créateur',
            VendorType::Freelance => 'Photographe',
        };

        return $this->withId(
            (new Service())
                ->setName($name)
                ->setSlug(strtolower($name))
                ->setSortOrder(1)
                ->setCategory($type)
        );
    }

    private function inviteToken(Vendor $vendor): InviteToken
    {
        return $this->baseInviteToken()
            ->setVendor($vendor)
            ->setUser($vendor->getUser());
    }

    private function baseInviteToken(): InviteToken
    {
        return $this->withTimestamps(
            $this->withId(
                (new InviteToken())
                    ->setToken('invite-token')
                    ->setPersona(InviteTokenPersona::Vendor)
                    ->setStatus(InviteTokenStatus::Pending)
                    ->setExpiresAt(new \DateTimeImmutable('2026-08-01 10:00:00'))
            )
        );
    }

    /** @template T of object @param T $entity @return T */
    private function withId(object $entity): object
    {
        $property = new \ReflectionProperty($entity, 'id');
        $property->setValue($entity, new UuidV7());

        return $entity;
    }

    /** @template T of object @param T $entity @return T */
    private function withTimestamps(object $entity): object
    {
        $createdAt = new \ReflectionProperty($entity, 'createdAt');
        $createdAt->setValue($entity, new \DateTimeImmutable('2026-06-01 10:00:00'));
        $updatedAt = new \ReflectionProperty($entity, 'updatedAt');
        $updatedAt->setValue($entity, new \DateTimeImmutable('2026-06-02 10:00:00'));

        return $entity;
    }
}
