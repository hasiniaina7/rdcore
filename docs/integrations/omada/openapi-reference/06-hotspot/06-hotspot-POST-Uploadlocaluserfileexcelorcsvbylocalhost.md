# Local User – Upload local user file (excel or csv) by localhost

- **Section** : 06 Hotspot

- **Tag Swagger** : Local User

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/files/hotspot/local-users`

- **Summary** : Upload local user file (excel or csv) by localhost

- **Description** : Upload local user file (excel or csv) by localhost.


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

    | config | HotspotPortalsOpenApiVO | yes |  |

    | file | string | yes |  |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/files/hotspot/local-users
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
