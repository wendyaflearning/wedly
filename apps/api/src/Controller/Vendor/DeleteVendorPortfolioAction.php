<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\Repository\Vendor\PortfolioImageRepository;
use App\Service\InviteTokenService;
use Cloudinary\Cloudinary;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

readonly class DeleteVendorPortfolioAction
{
    public function __construct(
        private InviteTokenService        $inviteTokenService,
        private PortfolioImageRepository  $portfolioImageRepository,
        private EntityManagerInterface    $em,
        private Cloudinary                $cloudinary,
        private LoggerInterface           $logger,
    ) {}

    #[Route('/api/v1/vendors/onboarding/{token}/portfolio/{imageId}', name: 'api_vendor_portfolio_delete', methods: ['DELETE'])]
    public function __invoke(string $token, string $imageId): JsonResponse
    {
        try {
            $inviteToken = $this->inviteTokenService->resolve($token);
            $vendor      = $inviteToken->getVendor();

            if (null === $vendor) {
                throw new \DomainException('Aucun prestataire associé à ce token.', 422);
            }

            $image = $this->portfolioImageRepository->findOneBy([
                'id'     => $imageId,
                'vendor' => $vendor,
            ]);

            if (null === $image) {
                return new JsonResponse(['error' => 'Image introuvable.'], 404);
            }

            $publicId = $image->getCloudinaryPublicId();

            $this->em->remove($image);
            $this->em->flush();

            try {
                if ($publicId) {
                    $this->cloudinary->uploadApi()->destroy($publicId);
                }
            } catch (\Throwable $e) {
                $this->logger->warning('Cloudinary destroy failed', [
                    'public_id' => $publicId,
                    'error'     => $e->getMessage(),
                ]);
            }

            return new JsonResponse(null, Response::HTTP_NO_CONTENT);
        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
