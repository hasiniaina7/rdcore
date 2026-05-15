# Voucher – Delete selected Voucher Groups

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/batch/delete`

- **Summary** : Delete selected Voucher Groups

- **Description** : Delete selected Voucher Groups with the given params.


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

    | type | integer | yes | Select type. It should be a value as follows: 0: Represents selecting all voucher groups, this selection does not pass parameter [groupIds]. 1: Parameter [groupIds] includes the IDs of the voucher groups to be selected. 2: Parameter [groupIds] includes the IDs of the voucher groups not to be selected |

    | groupIds | array | no | ID list of voucher groups. Voucher group can be created using 'Create Voucher Group' interface, and Voucher Group ID can be obtained from 'Get Voucher Group list' interface |

    | searchKey | string | no | Fuzzy query parameters, support field: voucher group name, voucher code |

    | timeStart | integer | no | End timestamp filter query parameters, unit: MS |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/batch/delete
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
