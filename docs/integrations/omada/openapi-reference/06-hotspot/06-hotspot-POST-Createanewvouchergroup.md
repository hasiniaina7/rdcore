# Voucher – Create a new Voucher Group

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `POST`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups`

- **Summary** : Create a new Voucher Group

- **Description** : Create a Voucher Group with the given params.


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

    | name | string | yes | Voucher group name. It should contain 1-32 characters |

    | amount | integer | yes | The amount of vouchers created. It should be within the range of 1-5000 |

    | codeLength | integer | yes | The length of voucher code. It should be within the range of 6–10. |

    | codeForm | array | yes | The character types contained in the voucher code. It should be a value as follows: 0: Number, 1: Letter. For example, [0] indicates that the code only contains numbers; [0, 1] indicates that the code contains numbers and letters |

    | limitType | integer | yes | The limitations of the voucher. It should be a value as follows: 0: Limited Usage Counts, 1: Limited Online Users, 2: Unlimited |

    | limitNum | integer | no | The number of limitations. It should be within the range of 1–999. If Parameter [limitType] is 0 or 1, [limitNum] should not be null.When Parameter [limitType] is 0, [limitNum] represents the maximum number of times this voucher can be used.When Parameter [limitType] is 1, [limitNum] represents the maximum number of users this voucher can be used at the same time. |

    | durationType | integer | yes | The duration type of the voucher. It should be a value as follows: 0: Client duration, each client expires after the duration is used. 1: Voucher duration, after reaching the voucher duration, clients using the voucher will expire |

    | duration | integer | yes | Duration of one use, unit: minute. It should be within the range of 1–14400000. |

    | timingType | integer | yes | The timing type of the voucher. It should be a value as follows: 0: Timing by time, clients can use vouchers for specified time duration. 1: Timing by usage, clients can use vouchers for the duration of actual usage |

    | rateLimit | RateLimitOpenApiVO | yes |  |

    | trafficLimitEnable | boolean | yes | Whether to enable traffic limit |

    | trafficLimit | integer | no | Traffic limit in MB. It should be within the range of 1–10485760 |

    | trafficLimitFrequency | integer | no | Frequency of traffic limit should be a value as follows: 0: total; 1: daily; 2: weekly; 3: monthly. |

    | unitPrice | integer | no | Price of single voucher. It should be within the range of 1–999999999 |

    | currency | string | no | Currency Short Code of voucher. For the values of Currency Short Code, refer to section 5.4.2 of the Open API Access Guide. |

    | applyToAllPortals | boolean | yes | Is the voucher effective for all portals, including all newly created portals |

    | portals | array | no | Bound portal ID list. Portal can be created using 'Add portal' interface, and portal ID can be obtained from 'Get portal list in a site' interface |

    | expirationTime | integer | no | The timestamp of the expiration of the voucher, unit: millisecond. When parameter [validityType] is 1, parameter [expirationTime] is required |

    | effectiveTime | integer | no | The timestamp when the voucher takes effect, unit: millisecond. When parameter [validityType] is 1, parameter [effectiveTime] is required |

    | logout | boolean | no | Whether the voucher support portal logout functionality |

    | description | string | no | Description of the voucher group |

    | printComments | string | no | Print comments of the voucher group |

    | validityType | integer | no | The validity type of the voucher. It should be a value as follows: 0: Voucher can be used at any time, parameter [effectiveTime], [expirationTime] and [schedule] should be null. 1: Voucher can be used between the effective time and expiration time, parameter [effectiveTime] and [expirationTime] should not be null, parameter [schedule] should be null. 2: Voucher can be used within a specified time period by schedule, parameter [effectiveTime] and [expirationTime] should be null, parameter [schedule] should not be null |

    | schedule | VoucherScheduleOpenApiVO | no |  |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponseCreatedResIdOpenApiVO`


## Exemple de requête
```
POST /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
