# Client – Get msp client statistics by device.

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/msp/{mspId}/clients/stat/devices`

- **Summary** : Get msp client statistics by device.

- **Description** : Get Msp level client statistics by device.


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

    | devices | array | yes | Devices to query |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseListMspDeviceClientNumOpenApiVO`


## Exemple de requête
```
POST /openapi/v1/msp/{mspId}/clients/stat/devices
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
