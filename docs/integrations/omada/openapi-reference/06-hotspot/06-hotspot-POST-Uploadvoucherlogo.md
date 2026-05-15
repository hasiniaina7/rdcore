# Voucher – Upload voucher logo

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/files/voucher/logos`

- **Summary** : Upload voucher logo

- **Description** : Upload voucher logo


## Request

- **Content-Type** : multipart/form-data

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | data | UploadVoucherGroupLogoOpenApiVO | yes |  |

    | file | string | yes | At least one of the file or md5 parameters needs to be passed |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponsePortal Picture Info`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/files/voucher/logos
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
