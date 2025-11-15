# Client Insight – Get past client number.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/dashboard/past-client-num`

- **Summary** : Get past client number.

- **Description** : Get past client number with the given omadacId and siteId.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | start | integer | yes | Start timestamp, in seconds, such as 1682000000 |

  | end | integer | yes | End timestamp, in seconds, such as 1682000000 |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClientSummaryVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/dashboard/past-client-num
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
