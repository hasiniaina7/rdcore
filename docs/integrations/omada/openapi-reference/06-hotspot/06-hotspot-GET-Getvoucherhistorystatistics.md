# Voucher – Get voucher history statistics

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/statistics/history`

- **Summary** : Get voucher history statistics

- **Description** : Get voucher history statistics.


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
  - **Schema** : `#/components/schemas/OperationResponseVoucherStatisticsHistoryOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/statistics/history
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
