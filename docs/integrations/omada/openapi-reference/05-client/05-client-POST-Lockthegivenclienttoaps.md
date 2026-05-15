# Client – Lock the given client to aps

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/lock-to-ap`

- **Summary** : Lock the given client to aps

- **Description** : Lock the given client to aps.


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

    | enable | boolean | yes | Lock to AP enable |

    | aps | array | no | AP MAC list. Use capital letters and separator, for example: AA-AA-AA-AA-AA-AA. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/lock-to-ap
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
