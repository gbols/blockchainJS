const express = require('express');
const rp = require('request-promise');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const port = process.argv[2];

const app = express();
const bitcoin = new Blockchain();
const nodeAddress = uuid().split('-').join('');

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get('/blockchain', (req, res) => {
  res.send(bitcoin); 
});

app.post('/transaction', (req, res) => {
 const { newTransaction } = req.body;
 const blockIndex = bitcoin.addTrasactionToPendingTransactions(newTransaction);
 res.send({
   note: `Transaction will be added in block ${blockIndex}`
 })
}); 

app.post('/transaction/broadcast', async (req, res) => {
  const { amount, sender, recipient } = req.body;
  const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient);
  bitcoin.addTrasactionToPendingTransactions(newTransaction);
  const requestPromises = [];

  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: { newTransaction },
      json: true
    }
    requestPromises.push(rp(requestOptions));
  });

  const data = await Promise.all(requestPromises);
  res.send({
    note: 'Transaction created and broadcasted successfully.'
  })
});

app.get('/mine', async (req, res) => {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index : lastBlock['index'] + 1
  }

  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

  const requestPromises = [];
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/receive-new-block',
      method: 'POST',
      body: { newBlock },
      json: true
    }
    requestPromises.push(rp(requestOptions));
  });

  await Promise.all(requestPromises);
  
  const rewardOptions = {
    uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
    method: 'POST',
    body: {
      amount: 12.5,
      sender:'00',
      recipient: nodeAddress
    },
    json: true
  }
  await rp(rewardOptions);
   
  res.send({
    note: `New block mined and broadcasted successfully`,
    block: newBlock
  })
});

app.post('/receive-new-block', (req, res) => {
  const { newBlock } = req.body;
  const lastBlock = bitcoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  if (correctHash && correctIndex) {
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTransactions = [];

    res.send({
      note: 'New Block received and accepted.',
      newBlock
    });
  } else {
    res.send({
      note: 'New Block rejected. ',
      newBlock
    })
  }
   
});

app.post('/register-and-broadcast-node', async (req, res) => {
  const { newNodeUrl } =  req.body;
  if (bitcoin.networkNodes.indexOf(newNodeUrl) === -1) bitcoin.networkNodes.push(newNodeUrl);

  const regNodePromises = [];

  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: { newNodeUrl },
      json: true 
    };
    regNodePromises.push(rp(requestOptions));
  });

  const data = await Promise.all(regNodePromises);
  const bulkRegisterOptions = {
    uri: newNodeUrl + '/register-nodes-bulk',
    method: 'POST',
    body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
    json: true
  };
  const bulkData = await rp(bulkRegisterOptions);
  res.send({
    node: 'New node registered with network successfully.',
  })
});

app.post('/register-node', (req, res) => {
  const { newNodeUrl } =  req.body;
  const notAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) === -1;
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
  if (notAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl); 
  res.send({
    note: 'New Node Registered successfully.'
  }); 
});

app.post('/register-nodes-bulk', (req, res) => {
  const { allNetworkNodes } = req.body;
  allNetworkNodes.forEach(networkNodeUrl => {
    const notAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) === -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
    if (notAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);
  }) 

  res.send({
    note: 'Bulk Registration successful.'
  });
}); 


app.get('/consensus', async (req, res) => {
  const requestPromises = [];
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true
    }
    requestPromises.push(rp(requestOptions));
  });

  const blockchains = await Promise.all(requestPromises);
  const currentChainLength = bitcoin.chain.length;
  let maxChainLength = currentChainLength;
  let newLongestChain = null;
  let newPendingTransactions = null;
  
  blockchains.forEach(blockchain => {
    if (blockchain.chain.length > maxChainLength) {
      maxChainLength = blockchain.chain.length;
      newLongestChain = blockchain.chain;
      newPendingTransactions = blockchain.pendingTransactions;
    }
  });

  if (!newLongestChain || (newLongestChain && !bitcoin.isChainValid(newLongestChain))) {
    res.send({
      note: 'current chain has not been replaced.',
      chain: bitcoin.chain
    });
  } else if (newLongestChain && bitcoin.isChainValid(newLongestChain)) {
    bitcoin.chain = newLongestChain;
    bitcoin.pendingTransactions = newPendingTransactions;
    res.send({
      note: 'This chain has been replaced. ',
      chain: bitcoin.chain
    })
  }
});

app.get('/block/:blockHash', (req, res) => {
  const { blockHash } = req.params;
  const block = bitcoin.getBlock(blockHash);
  res.send({
    block : block ? block : null
  })
});

app.get('/transaction/:transactionId', (req, res) => {
  const { transactionId } = req.params;
  const {transaction, block } = bitcoin.getTransaction(transactionId);
  res.send({
    transaction,
    block
  })
});


app.get('/address/:address', (req, res) => {
  const { address } = req.params;
  const addressData = bitcoin.getAddressData(address);
  res.send({
    addressData
  })
});


app.get('/block-explorer', (req, res) => {
  res.sendFile('./block-explorer/index.html', {root: __dirname});
});


app.listen(port, console.log(`running on port ${port} ...`));