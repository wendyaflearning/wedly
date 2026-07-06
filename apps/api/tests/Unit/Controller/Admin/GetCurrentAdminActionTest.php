<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Admin;

use App\Controller\Admin\GetCurrentAdminAction;
use App\Entity\User\User;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\UuidV7;

final class GetCurrentAdminActionTest extends TestCase
{
    public function test_invoke_returns_404_when_security_user_is_not_admin_entity(): void
    {
        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn(null);

        $response = (new GetCurrentAdminAction($security))();

        self::assertSame(404, $response->getStatusCode());
        self::assertSame(['error' => 'Admin not found.'], $this->decode($response));
    }

    public function test_invoke_returns_current_admin_payload(): void
    {
        $admin = (new User())
            ->setEmail('admin@example.fr')
            ->setFirstName('Denis')
            ->setLastName('Afrim')
            ->setPassword('hashed')
            ->setRoles(['ROLE_ADMIN']);
        $this->setPrivateProperty($admin, 'id', new UuidV7());

        $security = $this->createStub(Security::class);
        $security->method('getUser')->willReturn($admin);

        $response = (new GetCurrentAdminAction($security))();

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([
            'email'      => 'admin@example.fr',
            'first_name' => 'Denis',
            'last_name'  => 'Afrim',
            'roles'      => ['ROLE_ADMIN', 'ROLE_USER'],
        ], $this->decode($response));
    }

    private function decode(object $response): array
    {
        return json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new \ReflectionProperty($object, $property);
        $reflectionProperty->setValue($object, $value);
    }
}
