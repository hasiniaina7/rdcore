# Hotspot Operators – Get hotspot operator detail

- **Section** : 06 Hotspot

- **Tag Swagger** : Hotspot Operators

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators/{id}`

- **Summary** : Get hotspot operator detail

- **Description** : Get hotspot operator detail.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | id | string | yes | Hotspot Operator ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseOperator Response`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
