# Form Auth Data – Get authentication result lists for given survey

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}/auth-results`

- **Summary** : Get authentication result lists for given survey

- **Description** : Get an authentication survey's result list with given omadacId, siteId, surveyId.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | surveyId | string | yes | Auth survey ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | page | integer | yes | Start page number. Start from 1. |

  | pageSize | integer | yes | Number of entries per page. It should be within the range of 1–1000. |

  | sorts.formAuth | string | no | Sort parameter may be one of asc or desc. Optional parameter. If it is not carried, it means it is not sorted by this field. When there are more than one, the first one takes effect |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseGridVOFormAuthResultOpenApiVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys/{surveyId}/auth-results
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
