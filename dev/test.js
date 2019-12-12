const BlockChain = require('./blockchain');
 const bitcoin = new BlockChain();

 const bc1 ={
  "chain": [
    {
      "index": 1,
      "timestamp": 1576086839754,
      "transactions": [],
      "nonce": 100,
      "hash": "0",
      "previousBlockHash": "0"
    },
    {
      "index": 2,
      "timestamp": 1576086878338,
      "transactions": [],
      "nonce": 18140,
      "hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
      "previousBlockHash": "0"
    },
    {
      "index": 3,
      "timestamp": 1576086904451,
      "transactions": [
        {
          "amount": 12.5,
          "sender": "00",
          "recipient": "35b149b01c3f11ea9c050dee273499eb",
          "transactionId": "4cb7e9201c3f11ea9c050dee273499eb"
        },
        {
          "amount": 408,
          "sender": "WERTY54367IOPPLKXS",
          "recipient": "QWERTUIOPVFDSECXT765",
          "transactionId": "532f56301c3f11ea9c050dee273499eb"
        },
        {
          "amount": 478,
          "sender": "WERTY54367IOPPLKXS",
          "recipient": "QWERTUIOPVFDSECXT765",
          "transactionId": "56b1c6301c3f11ea9c050dee273499eb"
        },
        {
          "amount": 78,
          "sender": "WERTY54367IOPPLKXS",
          "recipient": "QWERTUIOPVFDSECXT765",
          "transactionId": "58e9dbe01c3f11ea9c050dee273499eb"
        }
      ],
      "nonce": 54486,
      "hash": "0000cb4c2b04b2641a1620bc7165bcd71befe86fb41e76e60f615907cd0ae7c3",
      "previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
    }
  ],
  "pendingTransactions": [
    {
      "amount": 12.5,
      "sender": "00",
      "recipient": "35b149b01c3f11ea9c050dee273499eb",
      "transactionId": "5c416b501c3f11ea9c050dee273499eb"
    }
  ],
  "currentNodeUrl": "http://localhost:3001",
  "networkNodes": []
}

console.log('ValidChain =>', bitcoin.isChainValid(bc1.chain));