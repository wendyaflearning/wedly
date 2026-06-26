<?php

declare(strict_types=1);

namespace App\Handler\Vendor\Onboarding;

use App\DTO\Vendor\Onboarding\LegalInfoStepRequestDto;
use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Integration\Pappers\PappersService;
use Psr\Log\LoggerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class LegalInfoStepHandler extends AbstractOnboardingStepHandler
{
    public function __construct(
        private PappersService $pappersService,
        private LoggerInterface $logger,
        ValidatorInterface $validator,
    ) {
        parent::__construct($validator);
    }

    public function supports(): OnboardingStep
    {
        return OnboardingStep::LegalInfo;
    }

    public function handle(Vendor $vendor, array $data): void
    {
        /** @var LegalInfoStepRequestDto $dto */
        $dto = $this->validate(LegalInfoStepRequestDto::fromArray($data));

        $vendor->setBrandName($dto->brandname);
        $vendor->getUser()->setFirstName($dto->firstname);
        $vendor->getUser()->setLastName($dto->lastname);
        $vendor->setSiret($dto->siret);
        $vendor->setPhone($dto->phone);
        $vendor->setAddress($dto->address);
        $vendor->setZipcode($dto->zipcode);
        $vendor->setCity($dto->city);

        $pappersData = $this->pappersService->findBySiret($dto->siret);

        if ($pappersData !== null) {
            $vendor->setLegalName($pappersData['legal_name']);
            $vendor->setLegalForm($pappersData['legal_form']);
            $vendor->setLegalStatus($pappersData['legal_status']);
            $vendor->setIncorporatedAt(
                isset($pappersData['incorporated_at'])
                    ? \DateTimeImmutable::createFromFormat('Y-m-d', $pappersData['incorporated_at']) ?: null
                    : null
            );

            $isActive = in_array($pappersData['legal_status'], PappersService::ACTIVE_STATUSES, true);
            $vendor->setSiretVerified($isActive);

            if (!$isActive) {
                $this->logger->warning('SIRET trouvé mais entreprise inactive', [
                    'siret'  => $dto->siret,
                    'statut' => $pappersData['legal_status'],
                ]);
            }
        } else {
            // legal_status laissé à null : Pappers inaccessible ≠ entreprise inactive
            $vendor->setSiretVerified(false);
            $this->logger->warning('SIRET non vérifié via Pappers', ['siret' => $dto->siret]);
        }
    }

    public function getStepData(Vendor $vendor): array
    {
        if ($vendor->getSiret() === null) {
            return [];
        }

        return [
            'brand_name'     => $vendor->getBrandName(),
            'first_name'     => $vendor->getUser()->getFirstName(),
            'last_name'      => $vendor->getUser()->getLastName(),
            'siret'          => $vendor->getSiret(),
            'phone'          => $vendor->getPhone(),
            'address'        => $vendor->getAddress(),
            'zipcode'        => $vendor->getZipcode(),
            'city'           => $vendor->getCity(),
            'siret_verified' => $vendor->isSiretVerified(),
            'legal_name'     => $vendor->getLegalName(),
            'legal_form'     => $vendor->getLegalForm(),
            'legal_status'   => $vendor->getLegalStatus(),
        ];
    }
}
