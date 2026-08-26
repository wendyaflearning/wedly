<?php

declare(strict_types=1);

namespace App\ArgumentResolver;

use App\Attribute\PublicActiveTagValue;
use App\Entity\Vendor\TagValue;
use App\Repository\Vendor\TagValueRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Controller\ValueResolverInterface;
use Symfony\Component\HttpKernel\ControllerMetadata\ArgumentMetadata;

/**
 * Résout un argument marqué #[PublicActiveTagValue] en TagValue actif.
 *
 * Déclenché par l'attribut et non par le type, pour ne pas s'imposer aux
 * controllers d'administration qui manipulent aussi des TagValue inactifs.
 *
 * Placer l'argument en premier dans la signature du controller : Symfony résout
 * les arguments dans l'ordre déclaré, ce qui garantit que le 404 « sous-style
 * introuvable » l'emporte sur les erreurs de validation des arguments suivants.
 */
final readonly class PublicActiveTagValueResolver implements ValueResolverInterface
{
    public function __construct(private TagValueRepository $tagValueRepository) {}

    /** @return iterable<TagValue> */
    public function resolve(Request $request, ArgumentMetadata $argument): iterable
    {
        $attributes = $argument->getAttributes(PublicActiveTagValue::class, ArgumentMetadata::IS_INSTANCEOF);
        if ($attributes === []) {
            return [];
        }

        $routeParameter = $attributes[0]->routeParameter;
        $tagValueId     = $request->attributes->get($routeParameter);

        $tagValue = is_string($tagValueId) ? $this->tagValueRepository->find($tagValueId) : null;
        if ($tagValue === null || !$tagValue->isActive()) {
            throw new \DomainException('Sous-style introuvable.', 404);
        }

        return [$tagValue];
    }
}
