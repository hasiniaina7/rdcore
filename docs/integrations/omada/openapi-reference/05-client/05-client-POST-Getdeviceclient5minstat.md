# Client Insight – Get device client 5 min stat.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/stat/{deviceMac}/client-stat-5min`

- **Summary** : Get device client 5 min stat.

- **Description** : Obtain the 5-minute sampling statistics of the clients.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | deviceMac | string | yes | Device MAC address, like AA-BB-CC-DD-EE-FF |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | deviceType | string | yes | Device type. |


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | start | integer | yes | Start timestamp, in seconds, such as 1682000000 |

    | end | integer | yes | End timestamp, in seconds, such as 1682000000 |

    | attrs | array | yes | Attribute list to get. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseListDeviceClientStatVO`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/stat/{deviceMac}/client-stat-5min
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
