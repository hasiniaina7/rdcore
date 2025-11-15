# Voucher – Delete expired vouchers in a voucher group

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}/clear-invalid`

- **Summary** : Delete expired vouchers in a voucher group

- **Description** : Delete expired vouchers in a voucher group.


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
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
DELETE /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}/clear-invalid
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
