# Client – Set name for given client

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `PATCH`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/name`

- **Summary** : Set name for given client

- **Description** : Set name for given client.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | clientMac | string | yes | Client MAC |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | name | string | yes | Client Name should contain 1 to 128 characters |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
PATCH /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/name
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
