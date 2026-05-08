<?php

declare(strict_types=1);

namespace App\Vendor\Onboarding\Service;

use App\Entity\Vendor\Vendor;
use App\Integration\Pappers\PappersService;
use App\Vendor\Onboarding\Request\LegalInfoStepRequest;
use Psr\Log\LoggerInterface;

readonly class LegalInfoStepService
{
    public function __construct(
        private PappersService $pappersService,
        private LoggerInterface $logger,
    ) {}

    public function handle(Vendor $vendor, LegalInfoStepRequest $dto): void
    {
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
