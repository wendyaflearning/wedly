<?php

declare(strict_types=1);

namespace App\Integration\Pappers;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

readonly class PappersService
{
    /** Statuts INSEE indiquant une entreprise en activité selon l'API Pappers. */
    public const ACTIVE_STATUSES = ['Actif'];

    public function __construct(
        private HttpClientInterface $client,
        private string $apiToken,
        private LoggerInterface $logger,
    ) {}

    public function findBySiret(string $siret): ?array
    {
        try {
            $response = $this->client->request('GET', 'entreprise', [
                'query' => ['siret' => $siret, 'api_token' => $this->apiToken],
            ]);

            if ($response->getStatusCode() !== 200) {
                $this->logger->warning('Pappers: réponse non-200', [
                    'status' => $response->getStatusCode(),
                    'siret'  => $siret,
                ]);

                return null;
            }

            $data = $response->toArray();

            return [
                'legal_name'      => $data['nom_entreprise'] ?? null,
                'legal_form'      => $data['forme_juridique'] ?? null,
                'incorporated_at' => $data['date_creation'] ?? null,
                'legal_status'    => $data['statut'] ?? null,
                'address'         => $data['siege']['adresse_ligne_1'] ?? null,
                'zipcode'         => $data['siege']['code_postal'] ?? null,
                'city'            => $data['siege']['ville'] ?? null,
            ];
        } catch (\Throwable $e) {
            $this->logger->warning('Pappers: exception réseau', [
                'siret' => $siret,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
