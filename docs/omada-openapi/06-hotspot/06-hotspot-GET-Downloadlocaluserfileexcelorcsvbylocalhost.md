# Local User – Download local user file (excel or csv) by localhost

- **Section** : 06 Hotspot

- **Tag Swagger** : Local User

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/files/hotspot/local-users`

- **Summary** : Download local user file (excel or csv) by localhost

- **Description** : Download local user file (excel or csv) by localhost.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | portals | string | yes | Portal ids of the portals to download local user file from. |

  | searchKey | string | no | Fuzzy query parameters, support field name,username |

  | fileType | string | yes | Local user file format: csv or xlsx. |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/files/hotspot/local-users
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
