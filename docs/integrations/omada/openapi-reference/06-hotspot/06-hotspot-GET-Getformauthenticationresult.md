# Form Auth Data – Get Form Authentication Result

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/form-auths/{formId}/auth-results`

- **Summary** : Get Form Authentication Result

- **Description** : Get Form Authentication Result.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | formId | string | yes | Form auth Id. |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | queryDataVO | object | yes | Query Data |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/form-auths/{formId}/auth-results
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
