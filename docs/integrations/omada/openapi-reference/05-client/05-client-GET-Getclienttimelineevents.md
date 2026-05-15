# Client – Get client timeline events

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/client-timeline`

- **Summary** : Get client timeline events

- **Description** : Get client timeline events.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | clientMac | string | yes | Client MAC |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | start | integer | yes | Start timestamp, unit: ms |

  | end | integer | yes | End timestamp, unit: ms |

  | type | integer | yes | Query type, 0: Connection Timeline; 1: Association; 2: Roaming; 3: Disconnection. |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseListActivity Records Of A Client's Single Connections`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/client-timeline
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
