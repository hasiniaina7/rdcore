# Client – Get client connection histories

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/client-connection`

- **Summary** : Get client connection histories

- **Description** : Get client connection histories.


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


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClient Connection Histories`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/client-connection
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
