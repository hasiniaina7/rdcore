# Client – Get client statistical data details at a hourly interval.

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/client-stat-detail/{clientMac}/hourly`

- **Summary** : Get client statistical data details at a hourly interval.

- **Description** : Get client statistical data details at a hourly interval.


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

    | startSec | integer | yes | Start timestamp, unit: second. |

    | endSec | integer | yes | End timestamp, unit: second. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClient Statistical Data Detail`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/client-stat-detail/{clientMac}/hourly
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
