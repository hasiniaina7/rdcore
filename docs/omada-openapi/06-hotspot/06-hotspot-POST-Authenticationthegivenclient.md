# Authorized Client – Authentication the given client

- **Section** : 06 Hotspot

- **Tag Swagger** : Authorized Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/clients/{clientMac}/auth`

- **Summary** : Authentication the given client

- **Description** : Authentication this client with the given omadacId, siteId, clientMac


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | clientMac | string | yes | Client MAC, format: AA-BB-CC-DD-EE-FF. |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/clients/{clientMac}/auth
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
