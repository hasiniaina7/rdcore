# Authorized Client – Delete all invalid authed record

- **Section** : 06 Hotspot

- **Tag Swagger** : Authorized Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-records/delete`

- **Summary** : Delete all invalid authed record

- **Description** : Delete all authentication record withs the given omadacId, siteId, authClientId.


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

    | start | integer | yes | Start timestamp, in seconds, such as 1682000000. |

    | end | integer | yes | End timestamp, in seconds, such as 1682000000. |

    | searchKey | string | no | Searching key for clients to delete, Searching by: client mac, client name, ssid name, network name. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/authed-records/delete
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
