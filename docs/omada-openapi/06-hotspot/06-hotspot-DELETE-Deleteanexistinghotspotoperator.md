# Hotspot Operators – Delete an existing hotspot operator

- **Section** : 06 Hotspot

- **Tag Swagger** : Hotspot Operators

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators/{id}`

- **Summary** : Delete an existing hotspot operator

- **Description** : Delete an existing hotspot operator.


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
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
DELETE /openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
