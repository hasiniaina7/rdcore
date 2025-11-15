# Client Insight – Get stack client stat.

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/stat/stacks/{stackId}/client-stat`

- **Summary** : Get stack client stat.

- **Description** : Obtain the sampling statistics of the clients.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | stackId | string | yes | Stack ID |


- **Query params** :

  None


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
POST /openapi/v1/{omadacId}/sites/{siteId}/stat/stacks/{stackId}/client-stat
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
