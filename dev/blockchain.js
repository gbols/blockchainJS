const sha256 = require('sha256');
const uuid = require('uuid/v1');
const currentNodeUrl = process.argv[3];

class BlockChain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = []; 
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    this.createNewBlock(100,'0', '0');
  }

  createNewBlock(nonce, previousBlockHash, hash) {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp : Date.now(),
      transactions: this.pendingTransactions,
      nonce,
      hash,
      previousBlockHash
    }

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock; 
  }

  getLastBlock() {
    return this.chain[this.chain.length -1];
  }

  createNewTransaction(amount, sender, recipient) {
    const newTransaction = {
      amount,
      sender, 
      recipient,
      transactionId: uuid().split('-').join('')
    }
    return newTransaction;
  }

  addTrasactionToPendingTransactions(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
  }

  hashBlock(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash; 
  }

  proofOfWork(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0,4) !== '0000') {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
  }
 
  isChainValid(blockChain) {
    let validChain = true;

    for (let i = 1, max = blockChain.length; i < max; i++ ) {
      const currentBlock = blockChain[i];
      const previousBlock = blockChain[i - 1];

      const blockHash = this.hashBlock(previousBlock.hash, {
        transactions: currentBlock.transactions,
        index: currentBlock.index
      }, currentBlock.nonce);

      if (blockHash.substring(0,4) !== '0000') {
        console.log('enter at ', i);
        validChain = false;
      }
      if (currentBlock.previousBlockHash !== previousBlock.hash) {
        console.log('currentBlock.previousBlockHash', currentBlock.previousBlockHash);
        console.log('previousBlock.hash', previousBlock.hash);
         validChain = false;
       }
    }

    const genesisBlock = blockChain[0];
    const correctNonce = genesisBlock.nonce === 100;
    const correctPreviousBlockHash = genesisBlock.previousBlockHash === '0';
    const correctHash = genesisBlock.hash === '0';
    const correctTransactions = genesisBlock.transactions.length === 0;

    if (!correctHash || !correctNonce || !correctPreviousBlockHash || !correctTransactions) validChain = false;
    return validChain;
  }

  getBlock(blockHash) {
    return this.chain.find(block => block.hash === blockHash);
  }

  getTransaction(transactionId) {
    let correctBlock = null;
    let correctTransaction = null;
     this.chain.forEach(block => {
      block.transactions.find(transaction => {
        if (transaction.transactionId === transactionId) {
          correctBlock = block;
          correctTransaction = transaction;
        }
      });
    });

    return { 
      block: correctBlock, 
      transaction: correctTransaction 
    };
  }


  getAddressData(address) {
     const addressTransactions = [];

      this.chain.forEach(block => {
      block.transactions.filter(transaction => {
        if (transaction.sender === address || transaction.recipient === address) {
          addressTransactions.push(transaction);
        }
      });
    });

    let balance = 0;
    addressTransactions.forEach(transaction => {
      if (transaction.recipient === address) balance += transaction.amount;
      else if (transaction.sender === address) balance -= transaction.amount;
    });

    return {
      addressTransactions,
      balance
    }
  }
}

module.exports = BlockChain;    