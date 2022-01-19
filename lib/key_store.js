/* This is free and unencumbered software released into the public domain. */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AccountID } from './account.js';
import { existsSync, readFileSync } from 'fs';
import * as NEAR from 'near-api-js';
export const KeyPair = NEAR.KeyPair;
const InMemoryKeyStore = NEAR.keyStores.InMemoryKeyStore;
const MergeKeyStore = NEAR.keyStores.MergeKeyStore;
const UnencryptedFileSystemKeyStore = NEAR.keyStores.UnencryptedFileSystemKeyStore;
export class KeyStore extends MergeKeyStore {
    constructor(networkID, keyStore, keyStores) {
        super([keyStore, ...keyStores]);
        this.networkID = networkID;
        this.keyStore = keyStore;
    }
    static load(networkID, env) {
        const memKeyStore = new InMemoryMultiKeyStore(networkID);
        if (env && env.HOME) {
            const devKeyStore = KeyStore.loadLocalKeys(env);
            const cliKeyStore = new UnencryptedFileSystemKeyStore(`${env.HOME}/.near-credentials`);
            return new KeyStore(networkID, memKeyStore, [devKeyStore, cliKeyStore]);
        }
        else {
            return new KeyStore(networkID, memKeyStore, []);
        }
    }
    static loadLocalKeys(env) {
        const keyStore = new InMemoryKeyStore();
        if (env && env.HOME) {
            const localValidatorKeyPath = `${env.HOME}/.near/validator_key.json`;
            if (existsSync(localValidatorKeyPath)) {
                const [accountID, keyPair] = _loadKeyFile(localValidatorKeyPath);
                keyStore.setKey('local', accountID, keyPair);
            }
        }
        return keyStore;
    }
    getAccounts() {
        const _super = Object.create(null, {
            getAccounts: { get: () => super.getAccounts }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const accounts = yield _super.getAccounts.call(this, this.networkID);
            return [...new Set(accounts)].sort();
        });
    }
    getSigningAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getAccounts()).map((id) => AccountID.parse(id).unwrap());
        });
    }
    getSigningAddresses() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getAccounts()).map((id) => AccountID.parse(id).unwrap().toAddress());
        });
    }
    reKey() {
        return __awaiter(this, void 0, void 0, function* () {
            this.keyStore.reKey();
        });
    }
    getKey(networkID, accountID) {
        const _super = Object.create(null, {
            getKey: { get: () => super.getKey }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.getKey.call(this, networkID, accountID);
        });
    }
    loadKeyFiles(keyFilePaths) {
        for (const keyFilePath of keyFilePaths) {
            const [accountID, keyPair] = _loadKeyFile(keyFilePath);
            this.keyStores[0].setKey(this.networkID, accountID, keyPair); // FIXME
        }
    }
    loadKeyFile(keyFilePath) {
        const [accountID, keyPair] = _loadKeyFile(keyFilePath);
        this.keyStores[0].setKey(this.networkID, accountID, keyPair);
    }
}
function _loadKeyFile(keyFilePath) {
    const keyJSON = JSON.parse(readFileSync(keyFilePath, 'utf8'));
    const keyPair = KeyPair.fromString(keyJSON.private_key || keyJSON.secret_key);
    return [keyJSON.account_id, keyPair];
}
export class InMemoryMultiKeyStore extends NEAR.keyStores.KeyStore {
    constructor(networkID) {
        super();
        this.networkID = networkID;
        this.reKeyCounter = 0;
        this.store = new Map();
    }
    reKey() {
        return __awaiter(this, void 0, void 0, function* () {
            this.reKeyCounter += 1;
        });
    }
    setKey(networkID, accountID, keyPair) {
        return __awaiter(this, void 0, void 0, function* () {
            if (networkID != this.networkID)
                return;
            const keyPairs = this.store.get(accountID) || new Set();
            keyPairs.add(keyPair);
            this.store.set(accountID, keyPairs);
        });
    }
    getKey(networkID, accountID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (networkID != this.networkID)
                return undefined;
            const keyPairs = this.store.get(accountID) || new Set();
            if (keyPairs.size == 0)
                return undefined;
            const keyIndex = this.reKeyCounter % keyPairs.size;
            return [...keyPairs][keyIndex];
        });
    }
    removeKey(networkID, accountID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (networkID != this.networkID)
                return;
            this.store.delete(accountID);
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            this.store.clear();
        });
    }
    getNetworks() {
        return __awaiter(this, void 0, void 0, function* () {
            return [this.networkID];
        });
    }
    getAccounts(networkID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (networkID != this.networkID)
                return [];
            return [...this.store.keys()];
        });
    }
    toString() {
        return 'InMemoryMultiKeyStore';
    }
}
