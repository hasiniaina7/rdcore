# Client – Export global client list.

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/files/client-list`

- **Summary** : Export global client list.

- **Description** : Export global client list.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | siteIds | array | yes | IDs of the site of the data to be exported. |

    | mode | integer | yes | Export columns mode. 0：All Columns  1: CurrentDisplayColumns. |

    | clientsDisplay | array | no | The information of client list for export. |

    | format | integer | yes | Format of file exported.0: CSV 1: XLSX |

    | queryDataVO | OpenApiQueryDataVO | no |  |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/files/client-list
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
