<?php

declare(strict_types=1);

namespace App\Tests\Functional\Repository\Vendor;

use App\Entity\User\User;
use App\Entity\Vendor\PortfolioImage;
use App\Entity\Vendor\Vendor;
use App\Enum\User\Role;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\PriceType;
use App\Enum\Vendor\VendorStatus;
use App\Repository\Vendor\PortfolioImageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Un prestataire ne doit jamais rafler toute la vitrine Wedream de la home
 * (WED-220) : ce test vérifie la diversité, pas le tri — le mélange rend
 * l'ordre non déterministe par construction.
 */
final class PortfolioImageRepositoryTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private PortfolioImageRepository $repository;

    protected function setUp(): void
    {
        self::bootKernel();

        $this->em         = static::getContainer()->get(EntityManagerInterface::class);
        $this->repository = static::getContainer()->get(PortfolioImageRepository::class);

        $this->em->getConnection()->beginTransaction();
    }

    protected function tearDown(): void
    {
        if ($this->em->getConnection()->isTransactionActive()) {
            $this->em->getConnection()->rollBack();
        }

        parent::tearDown();
    }

    public function testItNeverReturnsTwoPhotosFromTheSameVendor(): void
    {
        $vendorWithFivePhotos = $this->vendor('burst@example.test', 'Studio Rafale');
        for ($i = 0; $i < 5; $i++) {
            $this->photo($vendorWithFivePhotos, sprintf('burst-%d.jpg', $i));
        }
        $this->photo($this->vendor('one@example.test', 'Un Seul Cliché'), 'solo.jpg');
        $this->em->flush();

        $images = $this->repository->findWedreamShowcase(10);

        $vendorIds = array_map(static fn(PortfolioImage $image) => $image->getVendor()->getId()->toRfc4122(), $images);

        self::assertCount(2, $images);
        self::assertCount(2, array_unique($vendorIds));
    }

    public function testItExcludesPhotosHiddenFromWedream(): void
    {
        $this->photo($this->vendor('hidden@example.test', 'Studio Caché'), 'hidden.jpg', visibleInWedream: false);
        $this->em->flush();

        self::assertSame([], $this->repository->findWedreamShowcase(10));
    }

    public function testItExcludesVendorsWithWedreamDisabled(): void
    {
        $vendor = $this->vendor('off@example.test', 'Vitrine Fermée');
        $vendor->setWedreamEnabled(false);
        $this->photo($vendor, 'off.jpg');
        $this->em->flush();

        self::assertSame([], $this->repository->findWedreamShowcase(10));
    }

    public function testItRespectsTheRequestedLimit(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $this->photo($this->vendor(sprintf('vendor-%d@example.test', $i), sprintf('Studio %d', $i)), 'photo.jpg');
        }
        $this->em->flush();

        self::assertCount(2, $this->repository->findWedreamShowcase(2));
    }

    private function vendor(string $email, string $brandName): Vendor
    {
        $user = (new User())
            ->setFirstName('Test')
            ->setEmail($email)
            ->setRoles([Role::Vendor->value])
            ->setStatus(UserStatus::Active);
        $user->setPassword('irrelevant-here');

        $vendor = (new Vendor())
            ->setUser($user)
            ->setBrandName($brandName)
            ->setPhone('0600000000')
            ->setAddress('12 rue des Lilas')
            ->setPriceType(PriceType::PerService)
            ->setPriceMinCents(100_000)
            ->setPriceMaxCents(500_000)
            ->setStatus(VendorStatus::Active)
            ->setIsPublished(true)
            ->setWedreamEnabled(true);

        $this->em->persist($user);
        $this->em->persist($vendor);

        return $vendor;
    }

    private function photo(Vendor $vendor, string $filename, bool $visibleInWedream = true): PortfolioImage
    {
        $photo = (new PortfolioImage())
            ->setVendor($vendor)
            ->setUrl(sprintf('https://cdn.wedly.test/%s', $filename))
            ->setSortOrder(0)
            ->setVisibleInWedream($visibleInWedream);

        $this->em->persist($photo);

        return $photo;
    }
}
