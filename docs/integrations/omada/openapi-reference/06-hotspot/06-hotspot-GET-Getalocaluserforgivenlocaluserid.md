# Local User – Get a local user for given localuserId

- **Section** : 06 Hotspot

- **Tag Swagger** : Local User

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}`

- **Summary** : Get a local user for given localuserId

- **Description** : Get a local user with the given omadacId, siteId, local user ID.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | id | string | yes | local user ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseLocalUserOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
