# Voucher – Get voucher logo

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/files/voucher/logos/{picId}`

- **Summary** : Get voucher logo

- **Description** : Get voucher logo


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | picId | string | yes | Voucher logo picture id |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseObject`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/files/voucher/logos/{picId}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
