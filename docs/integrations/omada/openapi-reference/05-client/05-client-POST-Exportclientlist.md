# Client – Export client list

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/files/sites/{siteId}/clients/export`

- **Summary** : Export client list

- **Description** : Export client list.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | format | integer | yes | Format should be a value as follows: 0: csv; 1: xlsx. |

    | tables | array | yes | Tables should be a list of follows: 0: online; 1: offline; 2: blocked; 3: past-connection, 4: past-portal-auth. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/files/sites/{siteId}/clients/export
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
