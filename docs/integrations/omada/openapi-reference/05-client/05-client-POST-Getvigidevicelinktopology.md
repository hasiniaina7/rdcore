# Client – Get VIGI device link topology

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/vigis/{vigiMac}/vigi-link-topology`

- **Summary** : Get VIGI device link topology

- **Description** : Get VIGI device link topology.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | vigiMac | string | yes | VIGI device MAC |


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
POST /openapi/v1/{omadacId}/sites/{siteId}/vigis/{vigiMac}/vigi-link-topology
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
