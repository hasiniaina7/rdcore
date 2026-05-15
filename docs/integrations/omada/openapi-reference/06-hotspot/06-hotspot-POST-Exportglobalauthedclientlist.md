# Authorized Client – Export global authed client list

- **Section** : 06 Hotspot

- **Tag Swagger** : Authorized Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-client-list`

- **Summary** : Export global authed client list

- **Description** : Export global authed client list with the given omadacId, siteId.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | siteIds | array | no | Site IDs of the authed clients to export. |

    | format | integer | no | Export authed client format. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-client-list
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
