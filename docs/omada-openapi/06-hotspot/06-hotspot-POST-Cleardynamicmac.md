# Local User – Clear dynamic mac

- **Section** : 06 Hotspot

- **Tag Swagger** : Local User

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}/clear-dynamic-mac`

- **Summary** : Clear dynamic mac

- **Description** : Clear dynamic mac with the given omadacId, siteId, localuserId. The mac address binding type should be dynamic binding.


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
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}/clear-dynamic-mac
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
