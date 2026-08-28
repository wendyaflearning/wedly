<?php

declare(strict_types=1);

namespace App\Controller\Onboarding;

use App\Service\Vendor\VendorUnsubscribeService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Endpoint public appelé par la page Next.js /unsubscribe/[vendorId].
 *
 * POST et non GET : l'action mute un état, elle ne doit se déclencher que sur une
 * intention explicite — jamais sur un GET suivi par un scanner de sécurité email.
 *
 * `requirements` filtre les identifiants malformés au niveau du routeur : ils ne
 * matchent aucune route et sortent en 404 avant que la sécurité ou le service ne
 * soient consultés. Une seule règle de validation d'identifiant, pas deux.
 */
#[Route(
    '/api/v1/vendors/{vendorId}/unsubscribe',
    name: 'api_vendor_unsubscribe',
    requirements: ['vendorId' => '[0-9a-fA-F-]{36}'],
    methods: ['POST'],
)]
final readonly class PostVendorUnsubscribeAction
{
    public function __construct(
        private VendorUnsubscribeService $vendorUnsubscribeService,
    ) {}

    public function __invoke(string $vendorId): JsonResponse
    {
        $this->vendorUnsubscribeService->unsubscribeByVendorId($vendorId);

        return new JsonResponse(['unsubscribed' => true], 200);
    }
}
