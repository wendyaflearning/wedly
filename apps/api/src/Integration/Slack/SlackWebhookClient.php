<?php

declare(strict_types=1);

namespace App\Integration\Slack;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\HttpClient\HttpClientInterface;

readonly class SlackWebhookClient
{
    private const TIMEOUT_SECONDS = 3.0;

    public function __construct(
        private HttpClientInterface $httpClient,
        #[Autowire('%env(SLACK_WEBHOOK)%')]
        private string $slackWebhookUrl,
    ) {}

    public function notify(string $message): void
    {
        if ($this->slackWebhookUrl === '') {
            return;
        }

        $response = $this->httpClient->request('POST', $this->slackWebhookUrl, [
            'json'    => ['text' => $message],
            'timeout' => self::TIMEOUT_SECONDS,
        ]);

        if ($response->getStatusCode() >= 400) {
            throw new \RuntimeException(sprintf('Slack webhook returned status %d.', $response->getStatusCode()));
        }
    }
}
