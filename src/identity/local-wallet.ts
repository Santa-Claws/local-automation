import crypto from "crypto";
import fs from "fs";
import path from "path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const WALLET_FILENAME = "agent-wallet.json";
const KDF_N = 16384;
const KDF_R = 8;
const KDF_P = 1;

interface EncryptedWalletFile {
  version: 1;
  algorithm: "aes-256-gcm";
  kdf: "scrypt";
  kdfParams: { N: number; r: number; p: number };
  salt: string;
  iv: string;
  authTag: string;
  ciphertext: string;
  createdAt: string;
}

export interface LocalWalletOptions {
  stateDir: string;
  passphrase: string;
}

export interface LocalWallet {
  address: string;
  /** Keep this value process-local; do not persist, log, or place in prompts. */
  privateKey: `0x${string}`;
}

function walletPath(stateDir: string): string {
  return path.join(path.resolve(stateDir), WALLET_FILENAME);
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  if (passphrase.length < 12) {
    throw new Error("Local wallet passphrase must be at least 12 characters");
  }
  return crypto.scryptSync(passphrase, salt, 32, { N: KDF_N, r: KDF_R, p: KDF_P });
}

function encrypt(privateKey: `0x${string}`, passphrase: string): EncryptedWalletFile {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  return {
    version: 1,
    algorithm: "aes-256-gcm",
    kdf: "scrypt",
    kdfParams: { N: KDF_N, r: KDF_R, p: KDF_P },
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    createdAt: new Date().toISOString(),
  };
}

function decrypt(file: EncryptedWalletFile, passphrase: string): `0x${string}` {
  try {
    if (file.version !== 1 || file.algorithm !== "aes-256-gcm" || file.kdf !== "scrypt") {
      throw new Error("unsupported wallet file");
    }
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      deriveKey(passphrase, Buffer.from(file.salt, "base64")),
      Buffer.from(file.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(file.authTag, "base64"));
    const privateKey = Buffer.concat([
      decipher.update(Buffer.from(file.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error("invalid key payload");
    return privateKey as `0x${string}`;
  } catch {
    throw new Error("Unable to decrypt local wallet");
  }
}

function toWallet(privateKey: `0x${string}`): LocalWallet {
  return { privateKey, address: privateKeyToAccount(privateKey).address };
}

export function createLocalWallet(options: LocalWalletOptions): LocalWallet {
  const target = walletPath(options.stateDir);
  if (fs.existsSync(target)) throw new Error("Local wallet already exists");
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });

  const wallet = toWallet(generatePrivateKey());
  const encrypted = encrypt(wallet.privateKey, options.passphrase);
  const temporary = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(encrypted, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, target);
  fs.chmodSync(target, 0o600);
  return wallet;
}

export function loadLocalWallet(options: LocalWalletOptions): LocalWallet {
  const target = walletPath(options.stateDir);
  if (!fs.existsSync(target)) throw new Error("Local wallet does not exist");
  const encrypted = JSON.parse(fs.readFileSync(target, "utf8")) as EncryptedWalletFile;
  return toWallet(decrypt(encrypted, options.passphrase));
}

export function localWalletExists(stateDir: string): boolean {
  return fs.existsSync(walletPath(stateDir));
}
