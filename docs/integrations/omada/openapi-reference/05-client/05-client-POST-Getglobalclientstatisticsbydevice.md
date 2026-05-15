# Client – Get global client statistics by device.

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/clients/stat/devices`

- **Summary** : Get global client statistics by device.

- **Description** : Get global client statistics by device.


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

    | devices | array | yes | Devices to query |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseListDeviceClientNumOpenApiVO`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/clients/stat/devices
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
