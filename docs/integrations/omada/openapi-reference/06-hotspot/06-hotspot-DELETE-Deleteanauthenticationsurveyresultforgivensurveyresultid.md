# Form Auth Data – Delete an authentication survey result for given surveyResultId

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/auth-results/{surveyResultId}`

- **Summary** : Delete an authentication survey result for given surveyResultId

- **Description** : Delete an authentication survey result in a site with given omadacId, siteId, surveyResultId.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | surveyResultId | string | yes | Survey authentication result ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
DELETE /openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/auth-results/{surveyResultId}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
