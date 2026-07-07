<?php

declare(strict_types=1);

namespace App\Controller\Vendor;

use App\DTO\Vendor\VendorFeedbackRequestDto;
use App\Entity\User\User;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\VendorFeedbackService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/{id}/feedback', name: 'api_vendor_feedback_post', methods: ['POST'])]
final class PostVendorFeedbackAction extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly VendorRepository $vendorRepository,
        private readonly VendorFeedbackService $vendorFeedbackService,
    ) {}

    public function __invoke(string $id, #[MapRequestPayload] VendorFeedbackRequestDto $dto): JsonResponse
    {
        $vendor = $this->vendorRepository->find($id);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'Vendor not found.'], 404);
        }

        /** @var User $user */
        $user = $this->security->getUser();
        if ($vendor->getUser() !== $user) {
            return new JsonResponse(['error' => 'Access denied.'], 403);
        }

        try {
            $this->vendorFeedbackService->send($vendor, $dto->message);
        } catch (\Throwable) {
            return new JsonResponse(['error' => 'Impossible d’envoyer votre message pour le moment.'], 500);
        }

        return new JsonResponse(['status' => 'sent']);
    }
}
