# Client – Batch delete clients

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/delete`

- **Summary** : Batch delete clients

- **Description** : Batch delete clients.


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

    | start | integer | no | Start timestamp, in seconds, such as 1682000000. |

    | end | integer | no | End timestamp, in seconds, such as 1682000000. |

    | wireless | boolean | no | Wireless, filter by wireless field if provided. |

    | guest | boolean | no | Guest, filter by guest field if provided. |

    | rateLimit | boolean | no | RateLimit, filter by rateLimit field if provided. |

    | block | boolean | no | Block, filter by block field if provided. |

    | connectSuccess | boolean | no | Connect success, filter by connectSuccess field if provided. |

    | searchKey | string | no | Searching for clients to delete, Searching by client mac, client name. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClient Detail`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/clients/delete
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
