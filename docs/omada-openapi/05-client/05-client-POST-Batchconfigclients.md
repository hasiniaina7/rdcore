# Client – Batch config clients

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/config`

- **Summary** : Batch config clients

- **Description** : Batch config clients.


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

    | macList | array | no | List of clients' mac. |

    | ipSetting | Client Batch IP Setting | no |  |

    | rateLimit | Client Rate Limit Setting | no |  |

    | lockToAp | Client Lock To AP Setting | no |  |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClient Detail`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/clients/config
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
