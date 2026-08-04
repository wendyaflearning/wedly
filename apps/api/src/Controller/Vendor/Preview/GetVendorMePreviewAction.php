<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Preview;

use App\Assembler\Vendor\Preview\VendorMePreviewResponseDtoAssembler;
use App\Entity\User\User;
use App\Repository\Vendor\VendorRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/preview', name: 'api_vendor_me_preview_get', methods: ['GET'])]
final class GetVendorMePreviewAction extends AbstractController
{
    public function __construct(
        private readonly Security                            $security,
        private readonly VendorRepository                   $vendorRepository,
        private readonly VendorMePreviewResponseDtoAssembler $assembler,
    ) {}

    public function __invoke(): JsonResponse
    {
        /** @var User $user */
        $user   = $this->security->getUser();
        $vendor = $this->vendorRepository->findOneByUser($user);

        if ($vendor === null) {
            return new JsonResponse(['error' => 'No vendor associated with this account.'], 404);
        }

        return new JsonResponse($this->assembler->assemble($vendor));
    }
}
