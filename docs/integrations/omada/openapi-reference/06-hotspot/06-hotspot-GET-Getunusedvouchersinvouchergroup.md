# Voucher – Get unused vouchers in voucher group

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}/print-unused`

- **Summary** : Get unused vouchers in voucher group

- **Description** : Get unused vouchers brief information in a voucher group.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | groupId | string | yes | Voucher Group ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseListVoucherBriefOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}/print-unused
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
