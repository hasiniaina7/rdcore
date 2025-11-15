# Client – Unblock the client

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/unblock`

- **Summary** : Unblock the client

- **Description** : Unblock the client.


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
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/unblock
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
