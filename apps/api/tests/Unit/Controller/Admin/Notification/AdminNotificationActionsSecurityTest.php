<?php

declare(strict_types=1);

namespace App\Tests\Unit\Controller\Admin\Notification;

use App\Controller\Admin\Notification\GetUnreadAdminNotificationsCountAction;
use App\Controller\Admin\Notification\ListAdminNotificationsAction;
use App\Controller\Admin\Notification\MarkAdminNotificationReadAction;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class AdminNotificationActionsSecurityTest extends TestCase
{
    public function test_list_action_requires_admin_role_and_exposes_expected_route(): void
    {
        $this->assertAdminRoute(ListAdminNotificationsAction::class, '/api/v1/admin/notifications', ['GET']);
    }

    public function test_unread_count_action_requires_admin_role_and_exposes_expected_route(): void
    {
        $this->assertAdminRoute(GetUnreadAdminNotificationsCountAction::class, '/api/v1/admin/notifications/unread-count', ['GET']);
    }

    public function test_mark_read_action_requires_admin_role_and_exposes_expected_route(): void
    {
        $this->assertAdminRoute(MarkAdminNotificationReadAction::class, '/api/v1/admin/notifications/{id}/read', ['POST']);
    }

    private function assertAdminRoute(string $className, string $expectedPath, array $expectedMethods): void
    {
        $reflection = new \ReflectionClass($className);

        $isGranted = $reflection->getAttributes(IsGranted::class)[0]?->newInstance();
        self::assertInstanceOf(IsGranted::class, $isGranted);
        self::assertSame('ROLE_ADMIN', $isGranted->attribute);

        $route = $reflection->getAttributes(Route::class)[0]?->newInstance();
        self::assertInstanceOf(Route::class, $route);
        self::assertSame($expectedPath, $route->path);
        self::assertSame($expectedMethods, $route->methods);
    }
}
