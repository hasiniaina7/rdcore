# Client – Get client link topology

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/client-link-topology`

- **Summary** : Get client link topology

- **Description** : Get client link topology.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | clientMac | string | yes | Client MAC |


- **Query params** :

  None


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseListClient Topology Nodes Info`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/clients/{clientMac}/client-link-topology
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
