<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Exception\ValidationException;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::EXCEPTION)]
class ExceptionListener
{
    public function __construct(private readonly LoggerInterface $logger) {}

    public function __invoke(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception instanceof ValidationException) {
            $request = $event->getRequest();
            $this->logger->warning('Validation failed (422)', [
                'method'     => $request->getMethod(),
                'path'       => $request->getPathInfo(),
                'violations' => $exception->getViolations(),
            ]);
            $message = $exception->getViolations()[0]['message'] ?? 'Données invalides.';
            $event->setResponse(new JsonResponse(['error' => $message], 422));
            return;
        }

        if ($exception instanceof HttpExceptionInterface && $exception->getStatusCode() === 422) {
            $message = explode("\n", $exception->getMessage())[0] ?: 'Données invalides.';
            $event->setResponse(new JsonResponse(['error' => $message], 422));
        }
    }
}
