# CakePHP Application Skeleton

![Build Status](https://github.com/cakephp/app/actions/workflows/ci.yml/badge.svg?branch=master)
[![Total Downloads](https://img.shields.io/packagist/dt/cakephp/app.svg?style=flat-square)](https://packagist.org/packages/cakephp/app)
[![PHPStan](https://img.shields.io/badge/PHPStan-level%207-brightgreen.svg?style=flat-square)](https://github.com/phpstan/phpstan)

A skeleton for creating applications with [CakePHP](https://cakephp.org) 4.x.

The framework source code can be found here: [cakephp/cakephp](https://github.com/cakephp/cakephp).

## Installation

1. Download [Composer](https://getcomposer.org/doc/00-intro.md) or update `composer self-update`.
2. Run `php composer.phar create-project --prefer-dist cakephp/app [app_name]`.

If Composer is installed globally, run

```bash
composer create-project --prefer-dist cakephp/app
```

In case you want to use a custom app dir name (e.g. `/myapp/`):

```bash
composer create-project --prefer-dist cakephp/app myapp
```

You can now either use your machine's webserver to view the default home page, or start
up the built-in webserver with:

```bash
bin/cake server -p 8765
```

Then visit `http://localhost:8765` to see the welcome page.

## Update

Since this skeleton is a starting point for your application and various files
would have been modified as per your needs, there isn't a way to provide
automated upgrades, so you have to do any updates manually.

## Configuration

Read and edit the environment specific `config/app_local.php` and setup the 
`'Datasources'` and any other configuration relevant for your application.
Other environment agnostic settings can be changed in `config/app.php`.

## Layout

The app skeleton uses [Milligram](https://milligram.io/) (v1.3) minimalist CSS
framework by default. You can, however, replace it with any other library or
custom styles.

## Omada API Access (Secure Location Reference)

Omada OpenAPI v1 credentials are stored in database table `omada_api_settings` (not in source files).

- Storage location:
`omada_api_settings.api_client_id` + encrypted `omada_api_settings.api_client_secret` (preferred OAuth client-credentials mode)
`omada_api_settings.api_username` + encrypted `omada_api_settings.api_password` (authorization-code mode support)
- Access control: read/write endpoints are admin-only (`OmadaApiSettingsController`)
- Default controller endpoint: `https://167.86.71.186:8043`
- Default `omadac_id`: `5b6a916cf5c6ddfd396f85560f0c4d96`

Safe admin update workflow:

1. Authenticate with an admin token.
2. Read current state from `GET /omada-api-settings/view.json`.
3. Update with `POST /omada-api-settings/edit.json` and send secret fields only when rotating/changing them (`api_password`, `api_client_secret`).
4. Verify `enabled`, `site_id`, and connectivity before relying on quota enforcement.

Security reminders:

- Never commit cleartext Omada credentials to git, config files, logs, or CLI history.
- Rotate OpenAPI secrets on a regular schedule (`api_password` / `api_client_secret`) and immediately after staff/vendor access changes.
- Keep `OMADA_OPENAPI_ENABLE_COA_FALLBACK=false` unless temporary rollback is explicitly required.
