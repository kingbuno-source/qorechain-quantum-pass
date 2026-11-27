# QoreChain Quantum Pass — Build Before Q-Day

Quantum Pass entry for the QoreChain **Build Before Q-Day** developer fest
(https://build.qorechain.io). A small app that sends a **hybrid post-quantum
transaction** on the QoreChain testnet and reads the proof back from the chain.

## What it does

Every transaction from this app is signed twice:

- once with a classical **secp256k1** key, and
- once with a post-quantum **ML-DSA-87** key (NIST FIPS 204).

The validators check both signatures. The transaction carries a
`PQCHybridSignature` extension and the chain emits a `pqc_hybrid_verify`
event with status `verified`. This project:

1. Scaffolds a Hardhat project with a `Counter` contract.
2. Registers the account's ML-DSA-87 key on chain (one time).
3. Opens an EVM authorisation window with a hybrid-signed transaction.
4. Deploys the `Counter` contract to the testnet inside that window.
5. Reads the window-open transaction back from the public REST endpoint and
   prints the proof (`scripts/verify.ts`).

That is exactly what the Quantum Pass level asks for: a small app that sends a
hybrid post-quantum transaction and reads it back from the chain.

## Testnet account used

| Form | Address |
| --- | --- |
| EVM | `0xBA026b5A860c2078E8b1069F538b6908D0B0cd94` |
| QoreChain | `qor1hgpxkk5xpss83693q6048zmfprgtpnv5lvx8d7` |

Throwaway testnet account only. It holds test QOR with no value. Never send
real funds to it.

## How to run it

Needs Node.js 22 or later and pnpm 9 or later.

```sh
git clone https://github.com/kingbuno-source/qorechain-quantum-pass
cd qorechain-quantum-pass
pnpm install
cp .env.example .env
```

Make a throwaway account and put its secrets in `.env` (never commit `.env`):

```sh
node make-key.mjs          # writes a random PRIVATE_KEY into .env
pnpm window recovery-code  # paste the QRC1... code into .env
pnpm window status         # shows your qor1... address
```

Get test QOR from the faucet (100 QOR every 24 hours, free):

https://dashboard.qorechain.io/faucet — sign in, paste your `qor1...`
address, select **Request Tokens**.

Then run the flow:

```sh
pnpm test              # contract tests, local only
pnpm window register   # register the ML-DSA-87 key (one time, ~0.09 QOR)
pnpm window open       # hybrid-signed transaction, opens the window
pnpm deploy:testnet    # deploy Counter inside the window
```

Verify the hybrid signature on chain (use the `opened:` hash from the
window step):

```sh
pnpm verify <TX_HASH>
```

It prints the result code, the ML-DSA-87 signature size in the
`PQCHybridSignature` extension, and the `pqc_hybrid_verify` event status.
It exits 0 only when the code is 0 and the status is `verified`.

You can also check the transaction in the explorer at
https://explore.qore.network (switch to Testnet, search for the hash).

## Proof (on-chain)

_Pending: filled in after the testnet run below._

- Window-open (hybrid) transaction: _pending_
- Contract deployed at: _pending_
- `pqc_hybrid_verify` status: _pending_

## Project layout

| File | What it is |
| --- | --- |
| `contracts/Counter.sol` | The contract: one number, read / set / increment |
| `ignition/modules/Counter.ts` | The deploy recipe |
| `scripts/window.ts` | Register the key, open the window, show status |
| `scripts/verify.ts` | Read a transaction back and print the on-chain proof |
| `make-key.mjs` | Make a random throwaway private key into `.env` |
| `hardhat.config.ts` | Networks, including `qorechainTestnet` (chain ID 9800) |

## Network details

| Service | Address |
| --- | --- |
| Testnet | `qorechain-diana`, EVM chain ID 9800 |
| RPC | `https://rpc-testnet.qore.host` |
| REST | `https://api-testnet.qore.host` |
| EVM JSON-RPC | `https://evm-testnet.qore.host` |
| Explorer | `https://explore.qore.network` (Testnet) |
| Faucet | `https://dashboard.qorechain.io/faucet` |

1 QOR = 1,000,000 uqor.

## License

MIT — see `LICENSE`. `contracts/Counter.sol` comes from the QoreChain
project scaffolder (`create-qorechain-dapp`) and keeps its Apache-2.0 header.

Built following the QoreChain docs:
https://docs.qorechain.io/build-before-qday/workshop-1
