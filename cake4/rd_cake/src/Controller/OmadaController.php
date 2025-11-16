<?php

namespace App\Controller;

use App\Controller\AppController;
use Cake\Core\Configure;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Exception\GuzzleException;
use Cake\Event\EventInterface;
use Cake\Log\Log;

class OmadaController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('JsonErrors');
    }

    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);
        $this->Authentication->addUnauthenticatedActions(['extPortalAuth']);
    }

    /**
     * Proxy simple entre la Dynamic Login Page RadiusDesk et l’API Omada External Portal.
     *
     * POST /cake4/rd_cake/omada/ext-portal-auth.json
     *
     * Body attendu (x-www-form-urlencoded ou JSON) :
     * - username/password OU voucher
     * - clientMac, apMac/gatewayMac, ssidName/vid, radioId
     * - originUrl/redirectUrl éventuels
     */
    public function extPortalAuth()
    {
        $req = $this->request->getData();

        try {
            $this->logOmada('Incoming request', [
                'clientMac' => $req['clientMac'] ?? null,
                'voucher' => $req['voucher'] ?? null,
                'username' => $req['username'] ?? null,
                'redirectUrl' => $req['redirectUrl'] ?? $req['originUrl'] ?? null,
            ]);

            $targetHost = $req['omadaTarget'] ?? $req['target'] ?? null;
            $targetPort = $req['omadaPort'] ?? $req['targetPort'] ?? '8843';
            $scheme     = $req['omadaScheme'] ?? $req['scheme'] ?? 'https';

            if (empty($targetHost)) {
                throw new \RuntimeException('Missing Omada controller target');
            }
            if (empty($targetPort)) {
                $targetPort = '8843';
            }
            $submitUrl = $scheme . '://' . $targetHost . ':' . $targetPort . '/portal/radius/browserauth';

            $client = new GuzzleClient([
                'timeout' => 8,
                'verify'  => false,
            ]);

            $formParams = [
                'clientMac'   => $req['clientMac'] ?? '',
                'apMac'       => $req['apMac'] ?? '',
                'gatewayMac'  => $req['gatewayMac'] ?? '',
                'clientIp'    => $req['clientIp'] ?? '',
                'ssidName'    => $req['ssidName'] ?? '',
                'radioId'     => $req['radioId'] ?? '',
                'vid'         => $req['vid'] ?? '',
                'originUrl'   => $req['originUrl'] ?? '',
                'redirectUrl' => $req['redirectUrl'] ?? '',
                'authType'    => 2,
                'username'    => $req['username'] ?? '',
                'password'    => $req['password'] ?? '',
            ];

            $this->logOmada('POST /portal/radius/browserauth', [
                'url' => $submitUrl,
                'form' => $formParams,
            ]);

            $response = $client->post($submitUrl, [
                'form_params'     => $formParams,
                'allow_redirects' => false,
            ]);

            $status   = $response->getStatusCode();
            $body     = (string)$response->getBody();
            $location = $response->getHeaderLine('Location');

            $this->logOmada('Browserauth response', [
                'status' => $status,
                'body'   => $body,
                'location' => $location,
            ]);

            if ($status >= 400) {
                throw new \RuntimeException('Omada browserauth failed: HTTP ' . $status);
            }

            $redirectUrl = $location ?: ($req['redirectUrl'] ?? $req['originUrl'] ?? '/');
            $this->logOmada('Authentication succeeded', ['redirectUrl' => $redirectUrl]);

            $this->set([
                'success' => true,
                'data'    => ['redirect_url' => $redirectUrl],
            ]);
        } catch (\Exception $e) {
            $this->logOmada('Error', ['error' => $e->getMessage()]);
            $this->response = $this->response->withStatus(500);
            $this->set([
                'success' => false,
                'message' => $e->getMessage(),
            ]);
        }

        $this->viewBuilder()->setOption('serialize', ['success', 'data', 'message']);
    }

    protected function logOmada(string $message, ?array $data = null): void
    {
        $prefix = '[Omada] ' . $message;
        if (!empty($data)) {
            $prefix .= ' :: ' . json_encode($data);
        }
        Log::info($prefix);
    }
}
