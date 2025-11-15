# Form Auth Data – Export the Form Authentication Result List

- **Section** : 06 Hotspot

- **Tag Swagger** : Form Auth Data

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/files/hotspot/form-auths/{formId}/export`

- **Summary** : Export the Form Authentication Result List

- **Description** : Export the Form Authentication Result List.


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

  | exportFormVO | object | yes | Export Form Parameters |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/Single`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/files/hotspot/form-auths/{formId}/export
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
