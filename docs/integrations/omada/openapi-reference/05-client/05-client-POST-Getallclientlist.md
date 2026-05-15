# Client – Get all client list

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v2/{omadacId}/sites/{siteId}/clients`

- **Summary** : Get all client list

- **Description** : Get all clients, including online offline blocked and all list.


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

    | page | integer | yes | Start from 1. |

    | pageSize | integer | yes | It should be within the range of 1–1000. |

    | sorts | object | no | Sort rule, key: sort field, value: sort direction, value parameter may be one of asc or desc.Optional parameter. |

    | searchKey | string | no | Fuzzy query parameters, support field name, mac, ip. |

    | filters | ClientQueryFiltersOpenApiVO | no |  |

    | scope | integer | no | Scope of clients to query, 0: all, 1: online(default), 2:offline, 3:blocked. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClientGridVOClient Info`


## Exemple de requête
```
POST /openapi/v2/{omadacId}/sites/{siteId}/clients
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
