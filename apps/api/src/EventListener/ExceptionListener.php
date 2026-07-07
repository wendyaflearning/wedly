<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Exception\ValidationException;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::EXCEPTION)]
class ExceptionListener
{
    public function __construct(private readonly LoggerInterface $logger) {}

    public function __invoke(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        if (!$exception instanceof ValidationException) {
            return;
        }

        $request = $event->getRequest();
        $this->logger->warning('Validation failed (422)', [
            'method' => $request->getMethod(),
            'path' => $request->getPathInfo(),
            'violations' => $exception->getViolations(),
        ]);

        $event->setResponse(new JsonResponse(
            ['errors' => $exception->getViolations()],
            422
        ));
    }
}
