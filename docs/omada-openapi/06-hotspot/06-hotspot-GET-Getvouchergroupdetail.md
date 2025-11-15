# Voucher – Get Voucher Group Detail

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}`

- **Summary** : Get Voucher Group Detail

- **Description** : Get Voucher Group Detail with the given params.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | groupId | string | yes | Voucher Group ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | page | integer | yes | Start page number. Start from 1. |

  | pageSize | integer | yes | Number of entries per page. It should be within the range of 1–1000. |

  | sorts.code | string | no | Sort parameter may be one of asc or desc. Optional parameter. If it is not carried, it means it is not sorted by this field. When there are more than one, the first one takes effect |

  | filters.status | integer | no | Filter query parameters, support field status for vouchers in the voucher group: 0: unused vouchers, 1: in-use vouchers, 2: expired vouchers |

  | searchKey | string | no | Fuzzy query parameters, support field code |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseVoucherGroupGridOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
