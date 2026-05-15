# Authorized Client – Delete given authed record

- **Section** : 06 Hotspot

- **Tag Swagger** : Authorized Client

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-records/{id}`

- **Summary** : Delete given authed record

- **Description** : Delete the authentication record with the given omadacId, siteId, authClientId.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | id | string | yes | Authed record ID |


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
DELETE /openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-records/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
