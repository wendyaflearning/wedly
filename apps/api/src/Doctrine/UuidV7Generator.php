<?php

declare(strict_types=1);

namespace App\Doctrine;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Id\AbstractIdGenerator;
use Symfony\Component\Uid\UuidV7;

final class UuidV7Generator extends AbstractIdGenerator
{
    /**
     * Génère toujours un id neuf, sauf si l'entité en porte déjà un — le seul
     * cas où c'est possible est un test fonctionnel qui fixe l'id par
     * réflexion avant persist(), pour obtenir une valeur déterministe à
     * asserter. Sans ce garde-fou, `generateId()` écrasait silencieusement
     * cette valeur au flush, qu'elle vienne d'un test ou d'ailleurs.
     *
     * `isInitialized()` seul ne suffit pas : une propriété nullable avec une
     * valeur par défaut (ex. `User::$id = null`) compte comme initialisée dès
     * la construction, sans qu'un id ait jamais été posé — d'où le contrôle
     * explicite sur la valeur elle-même.
     */
    public function generateId(EntityManagerInterface $em, $entity): UuidV7
    {
        $field    = $em->getClassMetadata($entity::class)->getSingleIdentifierFieldName();
        $property = new \ReflectionProperty($entity, $field);

        if ($property->isInitialized($entity) && $property->getValue($entity) !== null) {
            return $property->getValue($entity);
        }

        return new UuidV7();
    }
}
