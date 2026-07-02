<?php

declare(strict_types=1);

namespace App\Tests\Unit\Vendor\Onboarding;

use App\Entity\User\User;
use App\Entity\Vendor\Vendor;
use App\Enum\User\UserStatus;
use App\Enum\Vendor\OnboardingStep;
use App\Enum\Vendor\VendorStatus;
use App\Handler\Vendor\Onboarding\CredentialsStepHandler;
use App\Repository\User\UserRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class CredentialsStepHandlerTest extends TestCase
{
    public function test_supports_credentials_step(): void
    {
        $handler = $this->makeHandler(
            $this->createStub(UserPasswordHasherInterface::class),
            $this->createStub(UserRepository::class)
        );

        $this->assertSame(OnboardingStep::Credentials, $handler->supports());
    }

    public function test_get_step_data_returns_current_user_email(): void
    {
        $vendor = (new Vendor())->setUser($this->userWithId('old@example.com'));

        $result = $this->makeHandler(
            $this->createStub(UserPasswordHasherInterface::class),
            $this->createStub(UserRepository::class)
        )->getStepData($vendor);

        $this->assertSame(['email' => 'old@example.com'], $result);
    }

    public function test_handle_updates_credentials_and_marks_vendor_under_review(): void
    {
        $user = $this->userWithId('old@example.com');
        $vendor = (new Vendor())->setUser($user);

        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'new@example.com'])
            ->willReturn(null);

        $hasher = $this->createMock(UserPasswordHasherInterface::class);
        $hasher->expects($this->once())
            ->method('hashPassword')
            ->with($user, 'Password!123')
            ->willReturn('hashed-password');

        $this->makeHandler($hasher, $repository)->handle($vendor, [
            'email' => 'new@example.com',
            'last_name' => 'Martin',
            'password' => 'Password!123',
            'password_confirmation' => 'Password!123',
        ]);

        $this->assertSame('new@example.com', $user->getEmail());
        $this->assertSame('Martin', $user->getLastName());
        $this->assertSame('hashed-password', $user->getPassword());
        $this->assertSame(VendorStatus::UnderReview, $vendor->getStatus());
        $this->assertSame(UserStatus::UnderReview, $user->getStatus());
    }

    public function test_handle_rejects_email_used_by_another_user(): void
    {
        $currentUser = $this->userWithId('old@example.com');
        $existingUser = $this->userWithId('new@example.com');
        $vendor = (new Vendor())->setUser($currentUser);

        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'new@example.com'])
            ->willReturn($existingUser);

        $this->expectException(\DomainException::class);
        $this->expectExceptionCode(409);
        $this->expectExceptionMessage('Email already registered.');

        $this->makeHandler($this->createStub(UserPasswordHasherInterface::class), $repository)->handle($vendor, [
            'email' => 'new@example.com',
            'password' => 'Password!123',
            'password_confirmation' => 'Password!123',
        ]);
    }

    public function test_handle_allows_email_owned_by_current_user(): void
    {
        $user = $this->userWithId('same@example.com');
        $vendor = (new Vendor())->setUser($user);

        $repository = $this->createMock(UserRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['email' => 'same@example.com'])
            ->willReturn($user);

        $hasher = $this->createMock(UserPasswordHasherInterface::class);
        $hasher->expects($this->once())->method('hashPassword')->willReturn('hashed-password');

        $this->makeHandler($hasher, $repository)->handle($vendor, [
            'email' => 'same@example.com',
            'password' => 'Password!123',
            'password_confirmation' => 'Password!123',
        ]);

        $this->assertSame('same@example.com', $user->getEmail());
        $this->assertSame('hashed-password', $user->getPassword());
    }

    private function makeHandler(
        UserPasswordHasherInterface $passwordHasher,
        UserRepository $userRepository,
    ): CredentialsStepHandler {
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());

        return new CredentialsStepHandler($passwordHasher, $userRepository, $validator);
    }

    private function userWithId(string $email): User
    {
        $user = (new User())->setEmail($email)->setFirstName('Camille');
        $id = new \ReflectionProperty(User::class, 'id');
        $id->setValue($user, new UuidV7());

        return $user;
    }
}
