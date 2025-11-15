# Voucher – Get a voucher

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/{id}`

- **Summary** : Get a voucher

- **Description** : Get a voucher with the given params.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | id | string | yes | Voucher ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseVoucherOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
