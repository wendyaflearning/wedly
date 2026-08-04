<?php

declare(strict_types=1);

namespace App\Controller\Vendor\Publish;

use App\Entity\User\User;
use App\Service\Vendor\VendorOwnershipResolver;
use App\Service\Vendor\VendorProfileCompletionService;
use App\Service\Vendor\VendorPublishService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_VENDOR')]
#[Route('/api/v1/vendors/me/publish', name: 'api_vendor_me_publish_post', methods: ['POST'])]
final class PostVendorMePublishAction extends AbstractController
{
    private const SECTION_LABELS = [
        'bio'            => 'Biographie',
        'portfolio'      => 'Portfolio',
        'disponibilites' => 'Disponibilités',
        'zone'           => 'Zone d\'intervention',
        'tarifs'         => 'Tarifs',
    ];

    public function __construct(
        private readonly Security                       $security,
        private readonly VendorOwnershipResolver        $ownershipResolver,
        private readonly VendorProfileCompletionService $completionService,
        private readonly VendorPublishService           $publishService,
    ) {}

    public function __invoke(): JsonResponse
    {
        try {
            /** @var User $user */
            $user   = $this->security->getUser();
            $vendor = $this->ownershipResolver->resolveActive($user);

            $completion = $this->completionService->checkForPublish($vendor);

            $missing = array_values(array_map(
                fn(string $key) => self::SECTION_LABELS[$key] ?? $key,
                array_keys(array_filter($completion, fn(bool $filled) => !$filled)),
            ));

            if ($missing !== []) {
                return new JsonResponse(['missing_sections' => $missing], 422);
            }

            $this->publishService->publish($vendor);

            return new JsonResponse(['is_published' => true]);

        } catch (\DomainException $e) {
            return new JsonResponse(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
