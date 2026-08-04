<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\Confession\Confession;
use App\Entity\Culture\Culture;
use App\Entity\Vendor\Service;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Enum\Wedding\CultureType;
use App\Handler\Vendor\Onboarding\ExperiencesStepHandler;
use App\Repository\Vendor\VendorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class ExperiencesStepHandlerTest extends TestCase
{
    public function test_supports_experiences_step(): void
    {
        $handler = $this->makeHandler($this->createStub(EntityManagerInterface::class));

        $this->assertSame(OnboardingStep::Experiences, $handler->supports());
    }

    public function test_handle_replaces_cultures_and_confessions(): void
    {
        $culture = $this->cultureWithId('France', 'france');
        $confession = $this->confessionWithId('Laic', 'laic');

        $cultureRepository = $this->createMock(EntityRepository::class);
        $cultureRepository->expects($this->once())->method('find')->with('culture-1')->willReturn($culture);

        $confessionRepository = $this->createMock(EntityRepository::class);
        $confessionRepository->expects($this->once())->method('find')->with('confession-1')->willReturn($confession);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->exactly(2))
            ->method('getRepository')
            ->willReturnMap([
                [Culture::class, $cultureRepository],
                [Confession::class, $confessionRepository],
            ]);

        $vendor = (new Vendor())->addService($this->service('photographe', VendorType::Freelance));

        $this->makeHandler($em)->handle($vendor, [
            'culture_ids' => ['culture-1'],
            'confession_ids' => ['confession-1'],
        ]);

        $this->assertSame([$culture], $vendor->getCultures()->toArray());
        $this->assertSame([$confession], $vendor->getConfessions()->toArray());
    }

    public function test_handle_requires_culture_for_non_venue_vendor(): void
    {
        $vendor = (new Vendor())->addService($this->service('photographe', VendorType::Freelance));

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Vous devez selectionner au moins une experience culturelle');

        $this->makeHandler($this->createStub(EntityManagerInterface::class))->handle($vendor, [
            'confession_ids' => ['confession-1'],
        ]);
    }

    public function test_handle_requires_confession_for_non_venue_vendor(): void
    {
        $vendor = (new Vendor())->addService($this->service('photographe', VendorType::Freelance));

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Vous devez selectionner au moins un type de céremonie.');

        $this->makeHandler($this->createStub(EntityManagerInterface::class))->handle($vendor, [
            'culture_ids' => ['culture-1'],
        ]);
    }

    public function test_handle_allows_empty_experiences_for_venue_vendor(): void
    {
        $vendor = (new Vendor())->addService($this->service('lieu-de-reception', VendorType::Lieu));

        $this->makeHandler($this->createStub(EntityManagerInterface::class))->handle($vendor, []);

        $this->assertTrue($vendor->getCultures()->isEmpty());
        $this->assertTrue($vendor->getConfessions()->isEmpty());
    }

    public function test_handle_throws_when_culture_cannot_be_found(): void
    {
        $cultureRepository = $this->createMock(EntityRepository::class);
        $cultureRepository->expects($this->once())->method('find')->with('missing-culture')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('getRepository')->with(Culture::class)->willReturn($cultureRepository);

        $vendor = (new Vendor())->addService($this->service('photographe', VendorType::Freelance));

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Culture introuvable : missing-culture');

        $this->makeHandler($em)->handle($vendor, [
            'culture_ids' => ['missing-culture'],
            'confession_ids' => ['confession-1'],
        ]);
    }

    public function test_handle_throws_when_confession_cannot_be_found(): void
    {
        $culture = $this->cultureWithId('France', 'france');
        $cultureRepository = $this->createMock(EntityRepository::class);
        $cultureRepository->expects($this->once())->method('find')->with('culture-1')->willReturn($culture);

        $confessionRepository = $this->createMock(EntityRepository::class);
        $confessionRepository->expects($this->once())->method('find')->with('missing-confession')->willReturn(null);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->exactly(2))
            ->method('getRepository')
            ->willReturnMap([
                [Culture::class, $cultureRepository],
                [Confession::class, $confessionRepository],
            ]);

        $vendor = (new Vendor())->addService($this->service('photographe', VendorType::Freelance));

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(422);
        $this->expectExceptionMessage('Confession introuvable : missing-confession');

        $this->makeHandler($em)->handle($vendor, [
            'culture_ids' => ['culture-1'],
            'confession_ids' => ['missing-confession'],
        ]);
    }

    public function test_is_filled_and_get_step_data_reflect_selected_experiences(): void
    {
        $handler = $this->makeHandler($this->createStub(EntityManagerInterface::class));
        $vendor = new Vendor();

        $this->assertFalse($handler->isFilled($vendor));

        $vendor->addCulture($this->cultureWithId('France', 'france'));
        $vendor->addConfession($this->confessionWithId('Laic', 'laic'));

        $this->assertTrue($handler->isFilled($vendor));
        $this->assertSame('France', $handler->getStepData($vendor)['culture_ids'][0]['name']);
        $this->assertSame('Laic', $handler->getStepData($vendor)['confession_ids'][0]['name']);
    }

    public function test_is_filled_returns_true_when_sensitive_data_consent_is_refused(): void
    {
        $vendor = new Vendor();

        $vendorRepository = $this->createMock(VendorRepository::class);
        $vendorRepository->expects($this->once())
            ->method('findLatestMatchingConsent')
            ->with($vendor)
            ->willReturn(false);

        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        $handler = new ExperiencesStepHandler(
            $this->createStub(EntityManagerInterface::class),
            $vendorRepository,
            $validator,
        );

        $this->assertTrue($handler->isFilled($vendor));
    }

    private function makeHandler(EntityManagerInterface $em): ExperiencesStepHandler
    {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new ExperiencesStepHandler($em, $this->createStub(VendorRepository::class), $validator);
    }

    private function service(string $slug, VendorType $category): Service
    {
        return (new Service())->setName($slug)->setSlug($slug)->setSortOrder(1)->setCategory($category);
    }

    private function cultureWithId(string $name, string $slug): Culture
    {
        $culture = (new Culture())->setName($name)->setSlug($slug)->setType(CultureType::Country);
        $id = new \ReflectionProperty(Culture::class, 'id');
        $id->setValue($culture, new UuidV7());

        return $culture;
    }

    private function confessionWithId(string $name, string $slug): Confession
    {
        $confession = (new Confession())->setName($name)->setSlug($slug);
        $id = new \ReflectionProperty(Confession::class, 'id');
        $id->setValue($confession, new UuidV7());

        return $confession;
    }
}
