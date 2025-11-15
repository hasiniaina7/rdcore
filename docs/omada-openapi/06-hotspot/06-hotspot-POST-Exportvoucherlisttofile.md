# Voucher – Export voucher list to file

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/files/hotspot/sites/{siteId}/vouchers/export`

- **Summary** : Export voucher list to file

- **Description** : Export voucher list to file.


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

    | format | integer | yes | Export file format, should be a value as follows: 0: csv, 1: xlsx |

    | queryData | OpenApiQueryDataVO | no |  |

    | type | integer | yes | Select type. It should be a value as follows: 0: Represents selecting all voucher groups, this selection does not pass parameter [groupIds]. 1: Parameter [groupIds] includes the IDs of the voucher groups to be selected. 2: Parameter [groupIds] includes the IDs of the voucher groups not to be selected |

    | groupIds | array | no | ID list of voucher groups. Voucher group can be created using 'Create Voucher Group' interface, and Voucher Group ID can be obtained from 'Get Voucher Group list' interface |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/files/hotspot/sites/{siteId}/vouchers/export
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
