# Client Insight – Get clients rssi distribution.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/dashboard/client-rssi-distribution`

- **Summary** : Get clients rssi distribution.

- **Description** : Get clients rssi distribution with the given omadacId and siteId.


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
  - **Schema** : `#/components/schemas/OperationResponseClientRssiChannelDistributionVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/dashboard/client-rssi-distribution
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
