# Client – Get client info

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}`

- **Summary** : Get client info

- **Description** : Get client info.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | clientMac | string | yes | Client MAC |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClient Detail`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
