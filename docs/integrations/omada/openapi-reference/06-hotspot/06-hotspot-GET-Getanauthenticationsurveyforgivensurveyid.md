# Form Auth Data – Get an authentication survey for given surveyId

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}`

- **Summary** : Get an authentication survey for given surveyId

- **Description** : Get an authentication survey by the given omadacId, siteId, surveyId.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | surveyId | string | yes | Auth survey ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseFormAuthOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
