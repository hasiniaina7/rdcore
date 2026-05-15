# Authorized Client – Modify period for given authed record

- **Section** : 06 Hotspot

- **Tag Swagger** : Authorized Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-records/{id}/period`

- **Summary** : Modify period for given authed record

- **Description** : Extend the valid time of the authentication record with the given omadacId, siteId, authClientId.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | id | string | yes | Authed record ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | period | integer | yes | Extended timestamp. Unit:ms. Period should be within the range of 60000 to 86400000000000(60s to 1000000days). |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-records/{id}/period
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
