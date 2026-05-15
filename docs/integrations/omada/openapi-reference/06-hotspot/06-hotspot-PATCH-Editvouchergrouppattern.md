# Voucher – Edit voucher group pattern

- **Section** : 06 Hotspot

- **Tag Swagger** : Voucher

- **Method** : `PATCH`

- **Path** : `/openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}/pattern`

- **Summary** : Edit voucher group pattern

- **Description** : Edit vouvhcer group pattern.


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

    | patternType | integer | no | 0: Logo, 1: Title, 2: Disable |

    | position | integer | no | 0: Left, 1: Right, 2: Middle |

    | logoPictureId | string | no | Logo picture ID |

    | logoSize | integer | no | Logo size. It should be within the range of 50-175 |

    | title | string | no | Voucher title |

    | titleSize | integer | no | Voucher title size. It should be within the range of 12-18 |

    | ssidNetworkenable | boolean | no | Whether to print SSIDs and networks on the pattern of the voucher |

    | ssidList | array | no | SSID list on the pattern of the voucher |

    | networkList | array | no | Network list on the pattern of the voucher |

    | durationEnable | boolean | no | Whether to print duration of the voucher |

    | limitEnable | boolean | no | Whether to print limit information of the voucher |

    | printComments | string | no | Comments to print on the voucher |


## Responses

- **HTTP Status** : 200

  - **Content-Type** : */*
  - **Schema** : `#/components/schemas/OperationResponse`


## Exemple de requête
```
PATCH /openapi/v1/{omadacId}/sites/{siteId}/hotspot/voucher-groups/{groupId}/pattern
Headers: ...
Body:
{}
```)


## Exemple de réponse
```json
{}
```
