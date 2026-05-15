# Client – Set ip setting for given client

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `PATCH`

- **Path** : `/openapi/v1/{omadacId}/network/sites/{siteId}/cmd/clients/{clientMac}/update-ipSetting`

- **Summary** : Set ip setting for given client

- **Description** : Set ip setting for given client.


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

    | useFixedAddr | boolean | yes | Whether to use the specified IP. |

    | netId | string | no | LAN network ID. |

    | ip | string | no | Client IP. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
PATCH /openapi/v1/{omadacId}/network/sites/{siteId}/cmd/clients/{clientMac}/update-ipSetting
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
