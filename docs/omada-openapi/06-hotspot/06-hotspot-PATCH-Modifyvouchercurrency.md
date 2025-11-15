# Voucher – Modify voucher currency

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `PATCH`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/setting`

- **Summary** : Modify voucher currency

- **Description** : Modify voucher currency of the site.


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

    | currency | string | no | Currency Short Code of voucher. For the values of Currency Short Code, refer to section 5.4.2 of the Open API Access Guide. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
PATCH /openapi/v1/{omadacId}/sites/{siteId}/hotspot/setting
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
