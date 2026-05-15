# Local User – Modify an existing localuser

- **Section** : 06 Hotspot

- **Tag Swagger** : Local User

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}`

- **Summary** : Modify an existing localuser

- **Description** : Modify an existing local user with the given omadacId, siteId, localuserId.


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

    | password | string | yes | Password should contain 1 to 128 characters. |

    | enable | boolean | yes | Whether to enable. |

    | expirationTime | integer | yes | Expiration timestamp. Unit:ms. |

    | bindingType | integer | yes | MAC binding type should be a value as follows: 0: no binding; 1: static binding; 2: dynamic binding. |

    | macAddress | string | no | Mac address,the value is only available when the macType is static binding or dynamic binding. |

    | maxUsers | integer | yes | The maximum number of users online at the same time when the MAC binding type is No Binding. It cannot be modified after initialization. MaxUsers should be within the range of 1–2048. |

    | name | string | no | Name should contain 1 to 128 characters, with no spaces at the beginning and end, and spaces in the middle |

    | phone | string | no | Phone number should contain 1 to 20 characters. |

    | rateLimit | RateLimitOpenApiVO | yes |  |

    | trafficLimitEnable | boolean | yes | Whether to enable traffic limit. |

    | trafficLimit | integer | no | Traffic limit in MB. It should be within the range of 1–10485760. |

    | trafficLimitFrequency | integer | no | Frequency of traffic limit should be a value as follows: 0: total; 1: daily; 2: weekly; 3: monthly. |

    | portals | array | yes | Bound portal ID list. Portal can be created using 'Add portal' interface, and portal ID can be obtained from 'Get portal list in a site' interface |

    | logout | boolean | no | local user logout. enable local user logout |

    | applyToAllPortals | boolean | no | Is the localuser effective for all portals, including all newly created portals |

    | dailyLimitEnable | boolean | no | Whether to enable localuser daily time limit |

    | dailyLimit | DailyAuthTimeOpenApiVO | no |  |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseWithoutResult`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/localusers/{id}
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
