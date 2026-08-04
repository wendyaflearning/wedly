<?php

declare(strict_types=1);

namespace App\Tests\Unit\Integration\Slack;

use App\Integration\Slack\SlackWebhookClient;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

final class SlackWebhookClientTest extends TestCase
{
    public function test_notify_posts_json_message_to_configured_url(): void
    {
        $response = $this->createStub(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(200);

        $client = $this->createMock(HttpClientInterface::class);
        $client->expects($this->once())
            ->method('request')
            ->with(
                'POST',
                'https://hooks.slack.test/services/123',
                $this->callback(function (array $options): bool {
                    self::assertSame(['text' => 'Message important'], $options['json']);

                    return true;
                })
            )
            ->willReturn($response);

        (new SlackWebhookClient($client, 'https://hooks.slack.test/services/123'))
            ->notify('Message important');
    }

    public function test_notify_is_a_noop_when_webhook_url_is_empty(): void
    {
        $client = $this->createMock(HttpClientInterface::class);
        $client->expects($this->never())->method('request');

        (new SlackWebhookClient($client, ''))->notify('Message important');
    }

    public function test_notify_lets_network_exception_bubble_up(): void
    {
        $client = $this->createStub(HttpClientInterface::class);
        $client->method('request')->willThrowException(new \RuntimeException('timeout'));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('timeout');

        (new SlackWebhookClient($client, 'https://hooks.slack.test/services/123'))
            ->notify('Message important');
    }

    public function test_notify_throws_when_response_status_is_400_or_above(): void
    {
        $response = $this->createStub(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(500);

        $client = $this->createStub(HttpClientInterface::class);
        $client->method('request')->willReturn($response);

        $this->expectException(\RuntimeException::class);

        (new SlackWebhookClient($client, 'https://hooks.slack.test/services/123'))
            ->notify('Message important');
    }
}
