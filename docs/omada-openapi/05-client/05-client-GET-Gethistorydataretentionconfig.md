# Client – Get History data retention config.

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/controller/client/history-enable`

- **Summary** : Get History data retention config.

- **Description** : Get history data retention config.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseOmadacClientSettingOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/controller/client/history-enable
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
