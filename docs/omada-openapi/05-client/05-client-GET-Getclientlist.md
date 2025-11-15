# Client – Get client list

- **Section** : 05 Client

- **Tag Swagger** : Client

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/clients`

- **Summary** : Get client list

- **Description** : Get all clients.


## Request

- **Path params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | omadacId | string | yes | Omada ID |

  | siteId | string | yes | Site ID |


- **Query params** :

  | Name | Type | Required | Description |
  |------|------|----------|-------------|

  | page | integer | yes | Start page number. Start from 1. |

  | pageSize | integer | yes | Number of entries per page. It should be within the range of 1–1000. |

  | sorts.name | string | no | Sort parameter may be one of asc or desc. Optional parameter. If it is not carried, it means it is not sorted by this field. When there are more than one, the first one takes effect |

  | sorts.mac | string | no | Sort parameter may be one of asc or desc. Optional parameter. If it is not carried, it means it is not sorted by this field. When there are more than one, the first one takes effect |

  | sorts.ip | string | no | Sort parameter may be one of asc or desc. Optional parameter. If it is not carried, it means it is not sorted by this field. When there are more than one, the first one takes effect |

  | filters.wireless | string | no | Filter query parameters, support field wireless: true/false. |

  | filters.radioId | string | no | Filter query parameters, support field radioId: 0: 2G, 1: 5G1, 2: 5G2, 3: 6G |

  | filters.apMac | string | no | Filter query parameters, support field ap mac |

  | filters.switchMac | string | no | Filter query parameters, support field switch mac |

  | filters.gatewayMac | string | no | Filter query parameters, support field gateway mac |

  | searchKey | string | no | Fuzzy query parameters, support field clientName,clientMac,ip,channel,ssid,apName,apMac,switchMac,switchName,gatewayMac,gatewayName. |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseClientGridVOClient Info`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/clients
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
