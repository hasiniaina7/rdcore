# Client Insight – Get ap density.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/dashboard/ap-density`

- **Summary** : Get ap density.

- **Description** : Get ap density with the given omadacId and siteId.


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
  - **Schema** : `#/components/schemas/OperationResponseEapRssiChannelDistributionVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/dashboard/ap-density
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
