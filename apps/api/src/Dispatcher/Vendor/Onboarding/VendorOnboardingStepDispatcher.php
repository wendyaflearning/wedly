<?php

declare(strict_types=1);

namespace App\Dispatcher\Vendor\Onboarding;

use App\DTO\DTOInterface;
use App\DTO\Vendor\Onboarding\CredentialsStepRequest;
use App\DTO\Vendor\Step\CateringCharacteristicsDto;
use App\DTO\Vendor\Step\CateringPricingDto;
use App\DTO\Vendor\Step\ExperiencesDto;
use App\DTO\Vendor\Step\FreelancePricingDto;
use App\DTO\Vendor\Step\ProfessionsDto;
use App\DTO\Vendor\Step\VenueCharacteristicsDto;
use App\DTO\Vendor\Step\VenuePricingDto;
use App\DTO\Vendor\VendorOnboardingStepRequest;
use App\DTO\Vendor\VendorOnboardingStepResponse;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorType;
use App\Exception\ValidationException;
use App\Resolver\Vendor\OnboardingStepResolver;
use App\Service\Vendor\Onboarding\CredentialsStepService;
use App\Service\VendorOnboarding\CateringCharacteristicsStepService;
use App\Service\VendorOnboarding\ExperiencesStepService;
use App\Service\VendorOnboarding\ProfessionsStepService;
use App\Service\VendorOnboarding\VenueCharacteristicsStepService;
use App\Service\VendorOnboarding\ZonesPricingStepService;
use App\Vendor\Onboarding\Request\LegalInfoStepRequest;
use App\Vendor\Onboarding\Service\LegalInfoStepService;
use Doctrine\ORM\EntityManagerInterface;
use DomainException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class VendorOnboardingStepDispatcher
{
    public function __construct(
        private EntityManagerInterface             $em,
        private ProfessionsStepService             $professionsStepService,
        private ExperiencesStepService             $experiencesStepService,
        private VenueCharacteristicsStepService    $venueCharacteristicsStepService,
        private CateringCharacteristicsStepService $cateringCharacteristicsStepService,
        private ZonesPricingStepService            $zonesPricingStepService,
        private LegalInfoStepService               $legalInfoStepService,
        private CredentialsStepService             $credentialsStepService,
        private OnboardingStepResolver             $resolver,
        private ValidatorInterface                 $validator,
    ) {}

    public function handle(Vendor $vendor, VendorOnboardingStepRequest $dto): ?VendorOnboardingStepResponse
    {
        $step = OnboardingStep::tryFrom($dto->step);
        if ($step === null) {
            throw new \DomainException(sprintf('Étape inconnue : %s', $dto->step), 422);
        }

        $data       = $dto->data ?? [];
        $vendorType = VendorType::resolveVendorType($vendor->resolveVendorServices());

        match ($step) {
            OnboardingStep::Professions => $this->professionsStepService->handle(
                $vendor,
                $this->validate(ProfessionsDto::fromArray($data))
            ),
            OnboardingStep::Experiences => $this->experiencesStepService->handle(
                $vendor,
                ExperiencesDto::fromArray($data)
            ),
            OnboardingStep::VenueCharacteristics => $this->venueCharacteristicsStepService->handle(
                $vendor,
                $this->validate(VenueCharacteristicsDto::fromArray($data))
            ),
            OnboardingStep::CateringCharacteristics => $this->cateringCharacteristicsStepService->handle(
                $vendor,
                $this->validate(CateringCharacteristicsDto::fromArray($data))
            ),
            OnboardingStep::ZonesPricing => $this->zonesPricingStepService->handle(
                $vendor,
                $this->validate($this->resolveZonesPricingDto($vendorType, $data))
            ),
            OnboardingStep::Portfolio => throw new DomainException(
                'Cette étape utilise un endpoint dédié (/portfolio). Utilisez le bon endpoint.',
                400
            ),
            OnboardingStep::LegalInfo => $this->legalInfoStepService->handle(
                $vendor,
                $this->validate(LegalInfoStepRequest::fromArray($data))
            ),
            OnboardingStep::Credentials => $this->credentialsStepService->handle(
                $vendor,
                $this->validate(CredentialsStepRequest::fromArray($data))
            ),
        };

        $vendor->setOnboardingStep($step);
        $this->em->flush();

        if ($step === OnboardingStep::Credentials) {
            return null;
        }

        $steps = $this->resolver->getOnboardingSteps($vendorType);
        $idx   = array_search($step, $steps, true);

        return new VendorOnboardingStepResponse(
            next:      $this->resolver->resolveNextStep($vendorType, $step),
            completed: array_slice($steps, 0, $idx + 1),
        );
    }

    private function resolveZonesPricingDto(VendorType $vendorType, array $data): DTOInterface
    {
        return match ($vendorType) {
            VendorType::Lieu      => VenuePricingDto::fromArray($data),
            VendorType::Traiteur  => CateringPricingDto::fromArray($data),
            VendorType::Freelance => FreelancePricingDto::fromArray($data),
        };
    }

    private function validate(DTOInterface $dto): DTOInterface
    {
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $violations = [];
            foreach ($errors as $error) {
                $violations[] = [
                    'field'   => $error->getPropertyPath(),
                    'message' => $error->getMessage(),
                ];
            }
            throw new ValidationException($violations);
        }

        return $dto;
    }
}
