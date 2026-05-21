<?php

declare(strict_types=1);

return [
    'Omada' => [
        // Legacy external portal integration (/api/v2/hotspot/*)
        'base_url' => env('OMADA_BASE_URL', 'https://167.86.71.186:8043/5b6a916cf5c6ddfd396f85560f0c4d96'),
        'operator' => env('OMADA_OPERATOR', ''),
        'password' => env('OMADA_PASSWORD', ''),
    ],
    'OmadaOpenApi' => [
        // Fallback only. Primary source of truth is table omada_api_settings.
        'base_url' => env('OMADA_OPENAPI_BASE_URL', 'https://167.86.71.186:8043'),
        'omadac_id' => env('OMADA_OPENAPI_OMADAC_ID', '5b6a916cf5c6ddfd396f85560f0c4d96'),
        'site_id' => env('OMADA_OPENAPI_SITE_ID', ''),
        // Optional authorization-code mode credentials.
        'api_username' => env('OMADA_OPENAPI_USERNAME', ''),
        'api_password' => env('OMADA_OPENAPI_PASSWORD', ''),
        // Preferred OpenAPI OAuth client-credentials mode.
        'api_client_id' => env('OMADA_OPENAPI_CLIENT_ID', ''),
        'api_client_secret' => env('OMADA_OPENAPI_CLIENT_SECRET', ''),
        'enabled' => filter_var(env('OMADA_OPENAPI_ENABLED', false), FILTER_VALIDATE_BOOL),
        'enable_coa_fallback' => filter_var(env('OMADA_OPENAPI_ENABLE_COA_FALLBACK', false), FILTER_VALIDATE_BOOL),
    ],
];
