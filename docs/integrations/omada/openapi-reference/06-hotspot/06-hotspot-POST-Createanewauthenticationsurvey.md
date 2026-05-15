# Form Auth Data – Create a new authentication survey

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys`

- **Summary** : Create a new authentication survey

- **Description** : Create a authentication survey in a site with the given params.


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

    | title | string | yes | Form title (display for the authentication user). It should contain 1-2000 characters. |

    | name | string | yes | Form name (display for the controller user). It should contain 1-2000 characters. |

    | note | string | yes | Note should contain 1-2000 characters. |

    | authTimeout | AuthTimeOpenApiVO | yes |  |

    | cardList | array | yes | Form card list. |

    | published | boolean | yes | Whether to publish. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseCreatedResIdOpenApiVO`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/surveys
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
