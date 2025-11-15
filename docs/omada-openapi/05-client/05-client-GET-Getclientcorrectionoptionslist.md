# Client – Get client correction options list

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/correction-list`

- **Summary** : Get client correction options list

- **Description** : Get client correction options list


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
  - **Schema** : `#/components/schemas/OperationResponseClientCorrectionOptionListVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/correction-list
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
