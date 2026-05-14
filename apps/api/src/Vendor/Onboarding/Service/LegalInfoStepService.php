<?php

declare(strict_types=1);

namespace App\Vendor\Onboarding\Service;

use App\Entity\Vendor\Vendor;
use App\Enum\Vendor\OnboardingStep;
use App\Integration\Pappers\PappersService;
use App\Service\Vendor\Onboarding\AbstractOnboardingStepHandler;
use App\Vendor\Onboarding\Request\LegalInfoStepRequest;
use Psr\Log\LoggerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

readonly class LegalInfoStepService extends AbstractOnboardingStepHandler
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
        /** @var LegalInfoStepRequest $dto */
        $dto = $this->validate(LegalInfoStepRequest::fromArray($data));

        $vendor->setBrandName($dto->brandName);
        $vendor->setSiret($dto->siret);
        $vendor->setPhone($dto->phone);
        $vendor->setAddress($dto->address);
        $vendor->setZipcode($dto->zipcode);
        $vendor->setCity($dto->city);

        $pappersData = $this->pappersService->findBySiret($dto->siret);

        if ($pappersData !== null) {
            $vendor->setLegalName($pappersData['legal_name']);
            $vendor->setLegalForm($pappersData['legal_form']);
            $vendor->setIncorporatedAt(
                isset($pappersData['incorporated_at'])
                    ? \DateTimeImmutable::createFromFormat('Y-m-d', $pappersData['incorporated_at']) ?: null
                    : null
            );
            $vendor->setLegalStatus($pappersData['legal_status']);
            $vendor->setSiretVerified(true);
        } else {
            $vendor->setSiretVerified(false);
            $this->logger->warning('SIRET non vérifié via Pappers', ['siret' => $dto->siret]);
        }
    }
}
