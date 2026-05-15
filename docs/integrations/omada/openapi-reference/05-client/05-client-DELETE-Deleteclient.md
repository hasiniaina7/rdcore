# Client – Delete client

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}`

- **Summary** : Delete client

- **Description** : Delete client.


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
DELETE /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
