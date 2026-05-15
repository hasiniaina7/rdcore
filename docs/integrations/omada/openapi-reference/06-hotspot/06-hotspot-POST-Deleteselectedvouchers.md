# Voucher – Delete selected vouchers

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/batch/delete`

- **Summary** : Delete selected vouchers

- **Description** : Delete selected vouchers with the given params.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | type | integer | yes | Select type. It should be a value as follows: 0: Represents selecting all vouchers in the voucher group, this selection does not pass parameter [ids]. 1: Parameter [ids] includes the IDs of vouchers in the voucher group to be selected. 2: Parameter [ids] includes the IDs of vouchers in the voucher group not to be selected |

    | ids | array | no | ID list of vouchers. Voucher can be created using 'Create Voucher Group' interface, and Voucher ID can be obtained from 'Get Voucher Group Detail' interface |

    | groupId | string | yes | Voucher Group ID. Voucher group can be created using 'Create Voucher Group' interface, and Voucher Group ID can be obtained from 'Get Voucher Group list' interface |

    | searchKey | string | no | Fuzzy query parameters, support field: voucher code |

    | status | integer | no | voucher status filter query parameters. It should be a value as follows: 0: Unused vouchers, 1: In use vouchers, 2: Expired vouchers |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/vouchers/batch/delete
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
