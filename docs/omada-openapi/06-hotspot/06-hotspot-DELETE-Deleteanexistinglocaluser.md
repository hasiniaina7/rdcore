# Local User – Delete an existing localuser

- **Section** : 06 Hotspot

- **Tag Swagger** : Local User

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}`

- **Summary** : Delete an existing localuser

- **Description** : Delete an existing local user with the given omadacId, siteId, localuserId.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | id | string | yes | Local user ID |


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
DELETE /openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
