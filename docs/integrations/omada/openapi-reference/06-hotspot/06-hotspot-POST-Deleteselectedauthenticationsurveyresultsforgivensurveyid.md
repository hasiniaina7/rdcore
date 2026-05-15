# Form Auth Data – Delete selected authentication survey results for given surveyId

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}/auth-results`

- **Summary** : Delete selected authentication survey results for given surveyId

- **Description** : Delete selected authentication survey results in a site with given omadacId, siteId, surveyId.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | surveyId | string | yes | Survey authentication ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | type | string | yes | Type of Selection, allowed values: all, include, exclude. |

    | ids | array | no | IDs of Selected Form Auth Result. Required when type is not all. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}/auth-results
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
