/**
 * verify.ts - read a hybrid-signed transaction back from the QoreChain
 * testnet and print the on-chain proof that both signatures verified.
 *
 * Usage:
 *   pnpm verify <TX_HASH>
 *   QORE_TX_HASH=<TX_HASH> pnpm verify
 *
 * It prints the result code, the size of the ML-DSA-87 signature carried in
 * the PQCHybridSignature extension, and the pqc_hybrid_verify event status.
 * It exits 0 only when the code is 0 and the event says "verified".
 */
const REST = "https://api-testnet.qore.host";
const EXPLORER = "https://explore.qore.network";

const hash = process.argv[2] ?? process.env.QORE_TX_HASH;
if (!hash) {
  console.error("Usage: pnpm verify <TX_HASH>");
  process.exit(1);
}

const decode = (s: string): string => Buffer.from(s, "base64").toString("utf8");

const res = await fetch(`${REST}/cosmos/tx/v1beta1/txs/${hash}`);
if (!res.ok) {
  console.error(`Transaction not found yet (HTTP ${res.status}). Wait a few seconds and try again.`);
  process.exit(1);
}
const body = (await res.json()) as any;
const txResponse = body.tx_response ?? {};
const code = txResponse.code;
console.log(`tx:        ${hash}`);
console.log(`code:      ${code} (${code === 0 ? "success" : "failed"})`);

// The classical secp256k1 signature is the first signature on the tx.
const signatures: string[] = body.tx?.signatures ?? [];
if (signatures.length > 0) {
  console.log(`secp256k1 signature: ${Buffer.from(signatures[0], "base64").length} bytes`);
}

// Find the PQCHybridSignature extension anywhere in the tx body.
const found: any[] = [];
(function walk(node: any): void {
  if (!node || typeof node !== "object") return;
  if (typeof node["@type"] === "string" && node["@type"].includes("PQCHybridSignature")) found.push(node);
  for (const value of Object.values(node)) walk(value);
})(body.tx ?? {});
if (found.length > 0) {
  // The ML-DSA-87 signature is the longest base64 blob in the extension.
  let longest = "";
  (function walk(node: any): void {
    if (typeof node === "string" && /^[A-Za-z0-9+/=]+$/.test(node) && node.length > longest.length) longest = node;
    else if (node && typeof node === "object") for (const value of Object.values(node)) walk(value);
  })(found[0]);
  const bytes = longest ? Buffer.from(longest, "base64").length : 0;
  console.log(`PQCHybridSignature extension: present, ML-DSA-87 signature ${bytes} bytes`);
} else {
  console.log("PQCHybridSignature extension: NOT FOUND");
}

// The pqc_hybrid_verify event carries base64-encoded attributes.
const events: any[] = txResponse.events ?? [];
const verifyEvent = events.find((e) => e.type === "pqc_hybrid_verify");
let status = "not found";
if (verifyEvent) {
  for (const attr of verifyEvent.attributes ?? []) {
    if (decode(attr.key ?? "") === "status") status = decode(attr.value ?? "");
  }
}
console.log(`pqc_hybrid_verify: ${status}`);
console.log(`explorer:  ${EXPLORER} (switch to Testnet, search for the hash)`);

if (code === 0 && status === "verified") {
  console.log("PROOF: both signatures verified on chain.");
  process.exit(0);
} else {
  console.log("PROOF FAILED: expected code 0 and status verified.");
  process.exit(1);
}
