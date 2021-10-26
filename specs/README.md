Elite Dangerous Marketplace specs

Calls and messages:

# 1. ENLIST - assign a token to current connection and get user's offers assosiated to this token:

> Outbound Call:

{ "action":"offer",
  "data": {
    "method": "enlist",
    "payload": {
      "token": NON_HASHED_TOKEN  // GUID provided by the backend on 1st connection or any arbitrary unique ID
    }
  }
}

> Inbound Message:

{
  "code":"enlist",
  "trace":{ // trace is basically an index of user's offers and a link between his TOKEN and current connection id
    "token":NON_HASHED_TOKEN,
    "connectionId":"FCaHGcVDliACGeQ=",
    "offers":[
      "02a69a39-15bc-47e7-ad3a-e9dcd7e153a1"
    ]
  },
  "tokenHash":HASHED_TOKEN,
  "offers":[
    { // see `2. GETOFFERS` for comments, here just some of them
      "offerId":"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1",
      "info":{
        "nickname":"Cptn-trio",
        "location":"The Bubble"
      },
      "created":1630445560003,
      "expired":1630531960003,
      "token":HASHED_TOKEN,
      "connectionId":"FCaEXf9eliACHmg=",
      "bids":[
        "e7302adb-835e-422a-a6fe-c6a4ecbd7ec7"
      ],
      "items":[
        { "sname":"",
          "sstock":0,
          "dname":"",
          "supply":5,
          "dstock":0,
          "demand":2,
          "tradeid":0,
          "did":"material.good.largecapacitypowerregulator",
          "sid":"material.good.gmeds"
        }
      ]
    }
  ]
}

# 2. GETOFFERS - request all available offers to be packed in batches by 20 offers each and messaged back to you batch by batch

> Outbound Call:

{
  "action":"offer",
  "data":{
    "method":"getoffers"
  }
}

> Inbound Message:

{
  "code":"getoffers",
  "offers":[
    {
      "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b",
      "info":{
        "nickname":"cptn-solo",
        "location":"Cenufo"
      },
      "created":1630584749157,  // timestamp with milliseconds
      "expired":1630671149157,  // `created` + some offset (24h in ref. UI)
      "token":HASHED_TOKEN,
      "connectionId":"",  // empty empty if offer's owner is currently offline
      "bids":[            // ids of offers advised by their owners as matched ones
        "69ed6afc-734d-4b27-a4c8-875dd8458da9",
        ...
      ],
      "xbids"[            // tokens of bidders
        {
          "token":"",
          "tokenhash":HASHED_TOKEN,
          "accepted":true|false
        }, ...
      ]
      "items":[
        { "sname":"",     // supply item name only codes are meaningfull actually so name is empty
          "sstock":0,     // supply stock - can have current stock if available
          "dname":"",     // demand item name, see `sname`
          "supply":5,     // supply quantity, part of an offer
          "dstock":0,     // demand stock - see `sstock`
          "demand":5,     // demand quantity, part of an offer
          "tradeid":0,    // sequential number of item, 0-based for each offer
          "did":"material.data.opinionpolls",       // demand item ID, UI shows localised name of it
          "sid":"material.good.geneticrepairmeds"   // supply item ID, see `did`
        },
        ...
      ]
    },
    ...
  ],
  "page":0,
  "ofpages":1
}

# 3. PUBLISHOFFER - broadcast your own offer (or update to it)

> Outbound Call:
- Payload of this call is basically the same Offer object.
- Token and connection are omitted:
- connection passed via transport layer;
- token is processed internally by the backend as part of authorisation process.

{
  "action":"offer",
  "data":{
    "method":"publishoffer",
    "payload":{ // Offer object without token and connection id
      "offerId":"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1",
      "info":{
        "nickname":"Cptn-trio",
        "location":"The Bubble"
      },
      "bids":[...],
      "xbids":[...],
      "items":[
        { "tradeid":0,
          "sid":"material.good.gmeds",
          "sname":"",
          "sstock":0,
          "supply":5,
          "did":"material.good.largecapacitypowerregulator",
          "dname":"",
          "dstock":0,
          "demand":2
        }
      ],
      "created":1630590725023,
      "expired":1630677125023
    }
  }
}

> Inbound Message:
- NB: This message is broadcasted to all connected users, so even offer's owner gets it and can do something with it

{
  "code":"publishoffer",
  "offer":{ // same as in `2. GETOFFERS`, just one offer
    "offerId":"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1",
    "connectionId":"FCaHGcVDliACGeQ=",
    "token":HASHED_TOKEN,
    "info":{
      "nickname":"Cptn-trio",
      "location":"The Bubble"
    },
    "bids":[...],
    "xbids":[...],
    "items":[
      { "tradeid":0,
        "sid":"material.good.gmeds",
        "sname":"",
        "sstock":0,
        "supply":5,
        "did":"material.good.largecapacitypowerregulator",
        "dname":"",
        "dstock":0,
        "demand":2
      }
    ],
    "created":1630590725023,
    "expired":1630677125023
  }
}

# 4. DROPOFFERS - remove your own offer(s) from the market

> Outbound Call:

{
  "action":"offer",
  "data":{
    "method":"dropoffers",
    "payload":{
      "offerIds":[
        "02a69a39-15bc-47e7-ad3a-e9dcd7e153a1"
      ]
    }
  }
}

> Inbound Message:
- Broadcasted to all connected users:

{
  "code":"dropoffers",
  "offerIds":[
    "02a69a39-15bc-47e7-ad3a-e9dcd7e153a1"
  ]
}

# 5. BIDPUSH - push a bid to other player's offer

> Outbound Call:

{
  "action":"comms",
  "data":{
    "method":"bidpush",
    "payload":{
      "myOfferId:"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1",  // offer to add to other party offer's bids
      "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b"    // target offer to change bids of
    }
  }
}

> Inbound Message:
- Sent only to parties of the offer.
- It's UI's responsibility to reflect changes as only new bids collection is provided by the backend.
- Reference UI just looks into local offers collection and shows appropriate actions for offers with or without handshake (both sides have bids on each other)

{
  "code":"bidpush",
  "offer":{ // full data of an offer being sent but only `bids` are actually important
    "offerId":"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1",
    ...
    "bids":[ // most recent bids collection for the offer
      "69ed6afc-734d-4b27-a4c8-875dd8458da9",
      "3bb5c1ed-71f0-4790-babd-41902af624a6",
      "02a69a39-15bc-47e7-ad3a-e9dcd7e153a1"
    ],
    ...
  }
}

# 6. BIDPULL - pull (recall) your bid from other player's offer

> Outbound Call:

{
  "action":"comms",
  "data":{
    "method":"bidpull",
    "payload":{
      "myOfferId:"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1",  // offer to remove from other party offer's bids
      "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b"    // target offer to change bids of
    }
  }
}

> Inbound Message:
- Sent only to parties of the offer (see `5. BIDPUSH` for details)

{
  "code":"bidpull",
  "offer":{ // full data of an offer being sent but only `bids` are actually important
    ...
    "bids":[ // most recent bids collection for the offer
      "69ed6afc-734d-4b27-a4c8-875dd8458da9",
      "3bb5c1ed-71f0-4790-babd-41902af624a6"
    ],
    ...
  }
}

# 7. MESSAGE - send a chat message to an offer's owner

> Outbound Call:

{
  "action":"comms",
  "data":{
    "method":"message",
    "payload":{
      "message":{
        "myOfferId:"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1", // offer to show the message on on the recepient's side (sender's offer)
        "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b", // target offer (receiver's offer)
        "text":"hey",
        "inbound":true,
        "date":1630595348931
      }
    }
  }
}

> Inbound Message:
- Sent only to a recipient of the message (owner of a target offer)

{
  "code":"message",
  "message":{ //NB: `offerId` changed to `myOfferId` and vice versa by the API to position a message correctly on recepient's side
    "myOfferId":"63271c30-d8cb-43b1-9530-4a51e738ce5b", // offer to show the message on on the recepient's side (receiver's offer)
    "offerId":"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1", // offer to show the message on on my side (sender's offer)
    "text":"Th",
    "inbound":true, // not actually important as all messages received from the backend can be considered inbound
    "date":1630595362369 // date set by the other partie upon message sent (not a server date, but a client one)
  }
}

# 8. Messages broadcasted on user online status change:

> Inbound Message:
- Broadcasted when a user goes Online

{
  "code":"onlineoffers",
  "offerIds":[
    "02a69a39-15bc-47e7-ad3a-e9dcd7e153a1"
  ],
  "connectionId":"FCaHGcVDliACGeQ="
}

> Inbound Message:
- Broadcasted when a user goes Offline

{
  "code":"offlineoffers",
  "offerIds":[
    "02a69a39-15bc-47e7-ad3a-e9dcd7e153a1"
  ]
}

# 9. XBIDPUSH - push an implicit bid to other player's offer

> Outbound Call:

{
  "action":"comms",
  "data":{
    "method":"xbidpush",
    "payload":{
      "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b"    // target offer to change xbids of
    }
  }
}

> Inbound Message:
- Sent to all connected users to let UI hide/show offers with xbids being
- It's UI's responsibility to reflect changes as only new xbids collection is provided by the backend.
- Reference UI just looks into local offers collection and shows appropriate actions for offers with or without xbids

{
  "code":"xbidpush",
  "offer":{ // full data of an offer being sent but only `xbids` are actually important
    "offerId":"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1",
    ...
    "xbids":[ // most recent xbids collection for the offer
      {
        "token":"",                 // always empty in server responce
        "tokenhash": HASHED_TOKEN,  // hashed token of a bidder
        "timestamp":1630595362369,  // timestamp of an xbid
        "accepted":true|false       // always `false` for new xbid
      }, ...
    ],
    ...
  }
}

# 10. XBIDPULL - pull (recall) your xbid from other player's offer

> Outbound Call:

{
  "action":"comms",
  "data":{
    "method":"xbidpull",
    "payload":{
      "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b"    // target offer to change xbids of
    }
  }
}

> Inbound Message:
- Sent to all connected users to let UI hide/show offers with xbids being

{
  "code":"xbidpull",
  "offer":{ // full data of an offer being sent but only `xbids` are actually important
    ...
    "xbids":[   // most recent bids collection for the offer
      ...       // same structure as in `9. XBIDPUSH`
    ],
    ...
  }
}

# 11. XBIDACCEPT - accept (decline) an xbid

> Outbound Call:

{
  "action":"comms",
  "data":{
    "method":"xbidaccept",
    "payload":{
      "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b",     // target offer to change xbids of
      "tokenhash":HASHED_TOKEN,                             // hashed token of a xbid owner
      "accept":true|false                                   // `true` to accept, `false` to decline
    }
  }
}

> Inbound Message:
- Sent only to parties of the offer (see `9. XBIDPUSH` for details)

{
  "code":"xbidaccept",
  "offer":{ // full data of an offer being sent but only `xbids` are actually important
    ...
    "xbids":[   // most recent bids collection for the offer
      ...       // same structure as in `9. XBIDPUSH`
    ],
    ...
  }
}

> Inbound Message:
- Sent to all connected users to let UI hide/show offers with xbids being accepted/declined

{
  "code":"acceptedoffers|declinedoffers",
  "offerIds":[
    "02a69a39-15bc-47e7-ad3a-e9dcd7e153a1"
  ]
}

# 12. XMESSAGE - send a chat message to an offer's owner

> Outbound Call:

{
  "action":"comms",
  "data":{
    "method":"xmessage",
    "payload":{
      "message":{
        "tokenhash":HASHED_TOKEN,                          // receiver's token hash, not required if sent to offer owner
        "offerId":"63271c30-d8cb-43b1-9530-4a51e738ce5b", // message context offer
        "text":"hey",
        "date":1630595348931
      }
    }
  }
}

> Inbound Message:
- Sent only to a receiver of the message (specified in `message.tokenhash` of the outbound call)
- `message.tokenhash` can be safely omitted if a message is composed for an offer owner (`message.offerId` used to
identify the receiver)

{
  "code":"xmessage",
  "message":{
    "tokenhash":HASHED_TOKEN,                         // sender's token hash
    "offerId":"02a69a39-15bc-47e7-ad3a-e9dcd7e153a1", // offer to show the message on on my side (sender's offer)
    "text":"Th",
    "date":1630595362369 // date set by the other partie upon message sent (not a server date, but a client one)
  }
}
