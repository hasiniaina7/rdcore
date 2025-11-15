# Hotspot Operators – Get hotspot operators list

- **Section** : 06 Hotspot

- **Tag Swagger** : Hotspot Operators

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators`

- **Summary** : Get hotspot operators list

- **Description** : Get hotspot operators list.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | page | integer | yes | Start page number. Start from 1. |

  | pageSize | integer | yes | Number of entries per page. It should be within the range of 1–1000. |

  | sorts.name | string | no | Sort parameter may be one of asc or desc. Optional parameter. If it is not carried, it means it is not sorted by this field. When there are more than one, the first one takes effect |

  | searchKey | string | no | Fuzzy query parameters, support field name,note |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseGridVOOperator Response`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
