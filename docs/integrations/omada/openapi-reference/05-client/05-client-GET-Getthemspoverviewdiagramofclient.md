# Client Insight – Get the msp overview diagram of client.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `GET`

- **Path** : `/openapi/v1/msp/{mspId}/dashboard/client/overview-diagram`

- **Summary** : Get the msp overview diagram of client.

- **Description** : Get the msp overview diagram of client


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | mspId | string | yes | MSP ID |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseMspClientOverallVO`


## Exemple de requête
```
GET /openapi/v1/msp/{mspId}/dashboard/client/overview-diagram
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
