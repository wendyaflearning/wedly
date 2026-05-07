<?php
declare(strict_types=1);

namespace App\Factory;

use Cloudinary\Cloudinary;

class CloudinaryFactory
{
    public static function create(): Cloudinary
    {
        $cloudName = $_ENV['CLOUDINARY_CLOUD_NAME'] ?? getenv('CLOUDINARY_CLOUD_NAME');
        $apiKey    = $_ENV['CLOUDINARY_API_KEY'] ?? getenv('CLOUDINARY_API_KEY');
        $apiSecret = $_ENV['CLOUDINARY_API_SECRET'] ?? getenv('CLOUDINARY_API_SECRET');

        return new Cloudinary([
            'cloud' => [
                'cloud_name' => $cloudName,
                'api_key'    => $apiKey,
                'api_secret' => $apiSecret,
            ],
        ]);
    }
}
