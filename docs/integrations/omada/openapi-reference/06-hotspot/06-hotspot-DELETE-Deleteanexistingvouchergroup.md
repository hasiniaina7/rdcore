# Voucher – Delete an existing Voucher Group

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}`

- **Summary** : Delete an existing Voucher Group

- **Description** : Delete an existing Voucher Group with the given params.


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
DELETE /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
