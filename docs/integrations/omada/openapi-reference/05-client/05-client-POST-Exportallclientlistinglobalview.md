# Client – Export all client list in GLOBAL view

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/files/all-client-list`

- **Summary** : Export all client list in GLOBAL view

- **Description** : Export all client list in GLOBAL view, .


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

    | format | integer | yes | Format should be a value as follows: 0: csv; 1: xlsx. |

    | clientsDisplay | array | no | The information of client list for export. |

    | mode | integer | yes | Export columns mode. 0：All Columns  1: CurrentDisplayColumns. |

    | selectType | string | yes | Select type of the sites of clients to export. include: include selected sites, exclude: all but exclude selected sites, all: include all sites. |

    | siteIds | array | yes | List of site id to export. SiteIds should contains at least 1 element when [selectType] is "include". |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/files/all-client-list
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
