# omg-js-utxo-merge

A helper lib for merging utxos

## Usage example

```

const ChildChain = require('@omisego/omg-js-childchain')
const merge = require('@omisego/omg-js-utxo-merge')

const ADDRESS = 'my address'
const PRIVATE_KEY = 'my private key'

const childChain = new ChildChain('http://watcher.ari.omg.network/')

function signTransaction (unsignedTx, numUtxos, address) {
  const privateKeys = new Array(numUtxos).fill(PRIVATE_KEY)
  const signatures = childChain.signTransaction(unsignedTx, privateKeys)
  return childChain.buildSignedTransaction(unsignedTx, signatures)
}

function submitTransaction (signedTx) {
  return childChain.submitTransaction(signedTx)
}

childChain.getUtxos(ADDRESS)
  .then(utxos => merge(utxos, ADDRESS, signTransaction, submitTransaction))


```