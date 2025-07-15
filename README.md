# Bittensor Wallet Generator (Node.js)

A Node.js implementation of a Bittensor wallet generator that creates and manages Substrate-compatible wallets for the Bittensor network.

## Features

- Generate new Bittensor wallets with coldkey and hotkey pairs
- Restore wallets from existing mnemonic phrases
- Generate secure 12-word mnemonic phrases
- Create Substrate-compatible addresses (SS58 format)
- Save wallet files in organized directory structure
- Full compatibility with Bittensor ecosystem

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Run the wallet generator:
```bash
npm start
```

Or run directly:
```bash
node wallet_generator.js
```

## Usage

### Basic Usage

The main script will automatically create a test wallet:

```bash
npm start
```

### Programmatic Usage

You can also use the functions in your own Node.js applications:

```javascript
const { createNewWallet, createWalletFromMnemonic, initializeCrypto } = require('./wallet_generator');

async function example() {
    // Initialize crypto functions first
    await initializeCrypto();
    
    // Create a new wallet
    const walletInfo = await createNewWallet('my_wallet', './my_wallets');
    
    if (walletInfo.success) {
        console.log('Coldkey Address:', walletInfo.coldkey_address);
        console.log('Hotkey Address:', walletInfo.hotkey_address);
    }
    
    // Restore from mnemonic
    const restoredWallet = await createWalletFromMnemonic(
        'restored_wallet',
        'your coldkey mnemonic phrase here',
        'your hotkey mnemonic phrase here'
    );
}
```

## Output

The generator creates:

1. Wallet Directory Structure:
   ```
   wallets/
   └── wallet_name/
       ├── coldkey/
       │   └── keyfile
       └── hotkeys/
           └── default/
               └── keyfile
   ```

2. Wallet Info JSON: A summary file with public information (no private keys)

3. Console Output: Displays mnemonic phrases, addresses, and status

## Security

IMPORTANT SECURITY WARNINGS:

- Store mnemonic phrases securely - Anyone with access to your mnemonics can control your wallet
- Never share your mnemonic phrases - They provide complete access to your funds
- Backup your wallet files - Store them in multiple secure locations
- The mnemonic phrases are displayed in the console - Clear your terminal history after use

## Dependencies

- `@polkadot/keyring` - Key management and wallet operations
- `@polkadot/util-crypto` - Cryptographic functions and mnemonic generation
- `@polkadot/util` - Utility functions for encoding/decoding

## Compatibility

This wallet generator creates wallets compatible with:
- Bittensor network
- Substrate-based blockchains
- Polkadot ecosystem tools
- Standard SS58 address format

## API Reference

### `createNewWallet(walletName, walletPath, overwrite)`

Creates a new wallet with random mnemonic phrases.

Parameters:
- `walletName` (string): Name for the wallet (default: 'default')
- `walletPath` (string): Directory to store wallet files (default: './wallets')
- `overwrite` (boolean): Whether to overwrite existing files (default: true)

Returns: Promise resolving to wallet information object

### `createWalletFromMnemonic(walletName, coldkeyMnemonic, hotkeyMnemonic, walletPath)`

Restores a wallet from existing mnemonic phrases.

Parameters:
- `walletName` (string): Name for the restored wallet
- `coldkeyMnemonic` (string): 12-word mnemonic for coldkey
- `hotkeyMnemonic` (string): 12-word mnemonic for hotkey
- `walletPath` (string): Directory to store wallet files (default: './wallets')

Returns: Promise resolving to wallet information object

### `initializeCrypto()`

Initializes cryptographic functions. Must be called before using other functions.

Returns: Promise that resolves when crypto is ready