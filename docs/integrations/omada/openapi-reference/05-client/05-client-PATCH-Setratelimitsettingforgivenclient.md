# Client – Set ratelimit setting for given client

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `PATCH`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/ratelimit`

- **Summary** : Set ratelimit setting for given client

- **Description** : Set ratelimit setting for given client.


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

    | rateLimitId | string | no | Rate limit profile ID. Nullable when ratelimit type is custom. |

    | enable | boolean | no | Rate limit enable. |

    | upEnable | boolean | no | Up limit enable. |

    | upUnit | integer | no | Up limit unit should be a value as follows: 1: Kbps; 2: Mbps. |

    | upLimit | integer | no | Up limit should be within the range of 1–1024. |

    | downEnable | boolean | no | Down limit enable. |

    | downUnit | integer | no | Down limit unit should be a value as follows: 1: Kbps; 2: Mbps. |

    | downLimit | integer | no | Down limit should be within the range of 1–1024. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
PATCH /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/ratelimit
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
