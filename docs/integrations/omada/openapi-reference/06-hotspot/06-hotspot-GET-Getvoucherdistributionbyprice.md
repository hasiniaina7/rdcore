# Voucher – Get voucher distribution by price

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/statistics/history/distribution/unit-price`

- **Summary** : Get voucher distribution by price

- **Description** : Get voucher distribution by price.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | filters.timeStart | integer | yes | Filter query parameters, support field time range: start timestamp (second). |

  | filters.timeEnd | integer | yes | Filter query parameters, support field time range: end timestamp (second). |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseGridVOVoucherUnitPriceDistributionOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/statistics/history/distribution/unit-price
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
