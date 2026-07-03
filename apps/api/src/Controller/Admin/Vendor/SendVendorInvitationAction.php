<?php

declare(strict_types=1);

namespace App\Controller\Admin\Vendor;

use App\Entity\User\User;
use App\Repository\Vendor\VendorRepository;
use App\Service\Vendor\AdminVendorInvitationService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1/admin/vendors/{id}/send-invitation', name: 'api_admin_vendor_send_invitation', requirements: ['id' => '[0-9a-fA-F-]{36}'], methods: ['POST'])]
#[IsGranted('ROLE_ADMIN')]
final readonly class SendVendorInvitationAction
{
    public function __construct(
        private VendorRepository $vendorRepository,
        private AdminVendorInvitationService $invitationService,
        private Security $security,
    ) {}

    public function __invoke(string $id): JsonResponse
    {
        $vendor = $this->vendorRepository->findAdminProfile($id);
        if ($vendor === null) {
            return new JsonResponse(['error' => 'Vendor not found.'], 404);
        }

        $adminUser = $this->security->getUser();
        if (!$adminUser instanceof User) {
            throw new \RuntimeException('Authenticated admin user has an unsupported type.');
        }

        try {
            return new JsonResponse($this->invitationService->send($vendor, $adminUser));
        } catch (\DomainException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], $exception->getCode());
        }
    }
}
