# Client Insight – Get the Msp customers' client count.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `POST`

- **Path** : `/openapi/v1/msp/{mspId}/customers/client-count`

- **Summary** : Get the Msp customers' client count.

- **Description** : Get the Msp customers' client count.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | mspId | string | yes | MSP ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | customerIds | array | yes | Customer Ids to get client number. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseListCustomerListClientNumVO`


## Exemple de requête
```
POST /openapi/v1/msp/{mspId}/customers/client-count
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
