<?php

declare(strict_types=1);

namespace App\Tests\Unit\Integration\Pappers;

use App\Integration\Pappers\PappersService;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

final class PappersServiceTest extends TestCase
{
    private function makeService(HttpClientInterface $client, ?LoggerInterface $logger = null): PappersService
    {
        return new PappersService($client, 'fake-token', $logger ?? $this->createStub(LoggerInterface::class));
    }

    public function test_find_by_siret_maps_pappers_fields_correctly(): void
    {
        $response = $this->createStub(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(200);
        $response->method('toArray')->willReturn([
            'nom_entreprise'  => 'Studio Photo SAS',
            'forme_juridique' => 'Société par actions simplifiée',
            'date_creation'   => '2018-03-15',
            'statut'          => 'Actif',
            'siege'           => [
                'adresse_ligne_1' => '12 rue de la Paix',
                'code_postal'     => '75001',
                'ville'           => 'Paris',
            ],
        ]);

        $client = $this->createMock(HttpClientInterface::class);
        $client->expects($this->once())
            ->method('request')
            ->with('GET', 'entreprise', $this->arrayHasKey('query'))
            ->willReturn($response);

        $result = $this->makeService($client)->findBySiret('12345678901234');

        $this->assertSame('Studio Photo SAS', $result['legal_name']);
        $this->assertSame('Société par actions simplifiée', $result['legal_form']);
        $this->assertSame('2018-03-15', $result['incorporated_at']);
        $this->assertSame('Actif', $result['legal_status']);
        $this->assertSame('12 rue de la Paix', $result['address']);
        $this->assertSame('75001', $result['zipcode']);
        $this->assertSame('Paris', $result['city']);
    }

    public function test_find_by_siret_returns_null_on_non_200_response(): void
    {
        $response = $this->createStub(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(404);

        $client = $this->createStub(HttpClientInterface::class);
        $client->method('request')->willReturn($response);

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('warning');

        $result = $this->makeService($client, $logger)->findBySiret('00000000000000');

        $this->assertNull($result);
    }

    public function test_find_by_siret_returns_null_on_network_exception(): void
    {
        $client = $this->createStub(HttpClientInterface::class);
        $client->method('request')->willThrowException(new \RuntimeException('timeout'));

        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects($this->once())->method('warning');

        $result = $this->makeService($client, $logger)->findBySiret('12345678901234');

        $this->assertNull($result);
    }

    public function test_find_by_siret_handles_missing_siege_fields_gracefully(): void
    {
        $response = $this->createStub(ResponseInterface::class);
        $response->method('getStatusCode')->willReturn(200);
        $response->method('toArray')->willReturn([
            'nom_entreprise'  => 'Micro-entreprise',
            'forme_juridique' => null,
            'statut'          => 'Actif',
        ]);

        $client = $this->createStub(HttpClientInterface::class);
        $client->method('request')->willReturn($response);

        $result = $this->makeService($client)->findBySiret('12345678901234');

        $this->assertNull($result['address']);
        $this->assertNull($result['zipcode']);
        $this->assertNull($result['city']);
        $this->assertNull($result['incorporated_at']);
    }
}
