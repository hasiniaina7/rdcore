# Client Insight – Get known clients list

- **Section** : 05 Client

- **Tag Swagger** : Client Insight

- **Method** : `GET`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/insight/clients`

- **Summary** : Get known clients list

- **Description** : Get known clients list.


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

  | sorts.lastSeen | string | no | Sort parameter may be one of asc or desc. Optional parameter. If it is not carried, it means it is not sorted by this field. When there are more than one, the first one takes effect |

  | filters.timeStart | string | no | Filter query parameters, support field time range: start timestamp (ms). |

  | filters.timeEnd | string | no | Filter query parameters, support field time range: end timestamp (ms). |

  | filters.guest | string | no | Filter query parameters, support field guest: true/false. |

  | searchKey | string | no | Fuzzy query parameters, support field name,mac,ssid. |


- **Body (schema)** :

  None


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseGridVOKnownClientVO`


## Exemple de requête
```
GET /openapi/v1/{omadacId}/sites/{siteId}/insight/clients
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
