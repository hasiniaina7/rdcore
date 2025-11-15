# Authorized Client – Get hotspot statistic

- **Section** : 06 Hotspot

- **Tag Swagger** : Authorized Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/dashboard/statistics`

- **Summary** : Get hotspot statistic

- **Description** : Get hotspot statistic with the given omadacId and siteId.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | start | integer | no | Start timestamp, in seconds, such as 1682000000 |

  | end | integer | no | End timestamp, in seconds, such as 1682000000 |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseHotspotStatisticVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/dashboard/statistics
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
