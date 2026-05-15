# Form Auth Data – Delete an existing authentication survey

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `DELETE`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}`

- **Summary** : Delete an existing authentication survey

- **Description** : Delete an existing authentication survey by the given omadacId, siteId, surveyId.


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
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
DELETE /openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
