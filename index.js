
const { transaction } = require('@omisego/omg-js-util')
const numberToBN = require('number-to-bn')

function merge (utxos, address, signFunc, submitFunc) {
  // Split utxos by currency
  const currencies = utxos.reduce((map, utxo) => {
    const currency = utxo.currency
    if (!map.has(currency)) {
      map.set(currency, [])
    }
    map.get(currency).push(utxo)
    return map
  }, new Map())

  // Merge each currency.
  return Array.from(currencies).map(async ([currency, utxos]) => {
    while (utxos.length > 1) {
      console.log(`Merging ${utxos.length} utxos of ${currency}`)
      const submitted = await Promise.all(mergeUtxos(utxos,
        currency,
        address,
        signFunc,
        submitFunc
      ))

      // We can use the results of the submitted transactions to construct
      // utxos before they're put into blocks and continue the merging process.
      // Note that this should _not_ be done unless you trust the operator!
      utxos = submitted.map(submitted => ({
        blknum: submitted.result.blknum,
        txindex: submitted.result.txindex,
        oindex: 0,
        amount: submitted.value,
        currency
      }))
    }
    console.log(`Finished merging ${currency} utxos.`)
  })
}

function mergeUtxos (utxos, currency, address, signFunc, submitFunc) {
  // Split utxos into chunks of size 4
  const chunked = chunkArray(utxos, 4)

  // Create and sign a transaction from each chunk
  const signed = chunked.map(utxos => {
    const { tx, value } = createTransaction(utxos, currency, address)
    return {
      signed: signFunc(tx, utxos.length, address),
      value
    }
  })

  // Submit each signed transaction
  return signed.map(async (tx) => ({
    result: await submitFunc(tx.signed),
    value: tx.value
  }))
}

function createTransaction (utxos, currency, address) {
  const totalAmount = utxos.reduce(
    (acc, curr) => acc.add(numberToBN(curr.amount.toString())),
    numberToBN(0)
  )
  const txBody = transaction.createTransactionBody(
    address,
    utxos,
    address,
    totalAmount,
    currency
  )
  return {
    tx: transaction.encode(txBody),
    value: totalAmount
  }
}

function chunkArray (arr, chunkSize) {
  var results = []
  while (arr.length) {
    results.push(arr.splice(0, chunkSize))
  }
  return results
}

module.exports = merge
