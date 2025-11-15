# Client Insight – Get clients signal distribution.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/dashboard/client-signal-distribution`

- **Summary** : Get clients signal distribution.

- **Description** : Get clients signal distribution with the given omadacId and siteId.


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
  - **Schema** : `#/components/schemas/OperationResponseClientSignalDistributionVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/dashboard/client-signal-distribution
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
