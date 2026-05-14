<?php

declare(strict_types=1);

namespace App\Service\Vendor\Onboarding;

use App\DTO\DTOInterface;
use App\Entity\Vendor\Vendor;
use App\Exception\ValidationException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

abstract readonly class AbstractOnboardingStepHandler implements StepHandlerInterface
{
    public function __construct(protected ValidatorInterface $validator) {}

    protected function validate(DTOInterface $dto): DTOInterface
    {
        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $violations = [];
            foreach ($errors as $error) {
                $violations[] = ['field' => $error->getPropertyPath(), 'message' => $error->getMessage()];
            }
            throw new ValidationException($violations);
        }

        return $dto;
    }

    public function getStepData(Vendor $vendor): array
    {
        return [];
    }
}
