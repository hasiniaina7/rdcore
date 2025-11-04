<?php

declare(strict_types=1);

namespace App\Controller;

class ConsumptionController extends AppController
{
    public function index()
    {
        $this->viewBuilder()->setLayout(false);
        $this->set('apiKey', 'b4c6ac81-8c7c-4802-b50a-0a6380555b50');
    }
}

