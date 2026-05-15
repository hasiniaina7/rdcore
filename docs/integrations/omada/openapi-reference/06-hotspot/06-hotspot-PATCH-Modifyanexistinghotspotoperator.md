# Hotspot Operators – Modify an existing hotspot operator

- **Section** : 06 Hotspot

- **Tag Swagger** : Hotspot Operators

- **Method** : `PATCH`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators/{id}`

- **Summary** : Modify an existing hotspot operator

- **Description** : Modify an existing hotspot operator.


## Request

- **Content-Type** : application/json

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |

  | id | string | yes | Hotspot Operator ID |


- **Query params** :

  None


- **Body (schema)** :

  - Type racine : object
  - Champs :
    | Field | Type | Required | Description |
    |------|------|----------|-------------|

    | name | string | yes | Operator name should contain 1 to 128 ASCII characters. |

    | password | string | yes | Operator password should contain 1 to 128 ASCII characters. |

    | note | string | no | Operator note should contain 1 to 256 ASCII characters. |

    | operatorRoleType | integer | no | Operator role type should be a value as follows: 0: Administrator; 1: Viewer. |

    | lastSite | string | no | Last Site ID |

    | selectedSites | array | yes | Selected site ID list should contain at least one site for each operator. |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseString`


## Exemple de requête
```
PATCH /openapi/v1/{omadacId}/sites/{siteId}/hotspot/operators/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
