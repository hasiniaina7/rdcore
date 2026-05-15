# Client – Get client list filtering options

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/search-fields-options`

- **Summary** : Get client list filtering options

- **Description** : Get client list filtering options.


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
  - **Schema** : `#/components/schemas/OperationResponseClient Filtering Options`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/clients/search-fields-options
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
