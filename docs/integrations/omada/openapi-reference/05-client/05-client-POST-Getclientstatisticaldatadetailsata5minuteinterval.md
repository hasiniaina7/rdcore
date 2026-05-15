# Client – Get client statistical data details at a 5-minute interval.

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/client-stat-detail/{clientMac}/5Min`

- **Summary** : Get client statistical data details at a 5-minute interval.

- **Description** : Get client statistical data details at a 5-minute interval.


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
POST /openapi/v1/{omadacId}/sites/{siteId}/client-stat-detail/{clientMac}/5Min
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
