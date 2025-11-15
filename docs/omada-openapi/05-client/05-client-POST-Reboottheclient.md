# Client – Reboot the client

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/reboot`

- **Summary** : Reboot the client

- **Description** : Reboot the client.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | clientMac | string | yes | Client MAC |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | deviceId | string | no | DeviceId of device adopted in VMS.Used when rebooting adopted VIGI devices in device list |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/reboot
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
