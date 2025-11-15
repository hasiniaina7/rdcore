# Voucher – Get voucher currency candidates

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/currency-list`

- **Summary** : Get voucher currency candidates

- **Description** : Get voucher currency candidates.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseCurrencyCandidatesOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/currency-list
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
