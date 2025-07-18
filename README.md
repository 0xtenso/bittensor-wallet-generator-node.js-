# Bittensor Wallet Generator (Node.js)

A Node.js implementation of a Bittensor wallet generator that creates and manages Substrate-compatible wallets for the Bittensor TAO network.

## Features

- Generate new Bittensor wallets with coldkey and hotkey pairs
- Create wallets specifically for the TAO mainnet
- Restore wallets from existing mnemonic phrases
- Generate secure 12-word mnemonic phrases
- Create Substrate-compatible addresses (SS58 format)
- Save wallet files in organized directory structure
- Full compatibility with Bittensor ecosystem

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/bittensor-wallet-generator.git
cd bittensor-wallet-generator
```

2. Install Node.js dependencies:
```bash
npm install
```

## Usage

### Generate a TAO Mainnet Wallet (Recommended)

The easiest way to generate a wallet for the TAO mainnet is to use the dedicated script:

```bash
node generate_tao_wallet.js
```

This will:
1. Ask you for a wallet name
2. Generate a new wallet compatible with the TAO mainnet
3. Display the wallet addresses and mnemonic phrases
4. Save the wallet files in the `./wallets/` directory
5. Save public wallet information to a JSON file

### Basic Usage

You can also run the main script to create a test wallet:

```bash
npm start
```

Or run directly:
```bash
node wallet_generator.js
```

### Programmatic Usage

You can also use the functions in your own Node.js applications:

```javascript
const { createNewWallet, createWalletFromMnemonic, initializeCrypto } = require('./wallet_generator');

async function example() {
    // Initialize crypto functions first
    await initializeCrypto();
    
    // Create a new wallet for TAO mainnet
    const walletInfo = await createNewWallet('my_wallet', './my_wallets', true, true);
    
    if (walletInfo.success) {
        console.log('Network:', walletInfo.network);
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
       │   ├── keyfile
       │   └── coldkeypub.txt
       └── hotkeys/
           └── default/
               └── keyfile
   ```

2. Wallet Info JSON: A summary file with public information (no private keys)

3. Console Output: Displays mnemonic phrases, addresses, and status

## Bittensor TAO Mainnet

This wallet generator is specifically configured to work with the Bittensor TAO mainnet. The wallets created use:

- SS58 Format: 42 (Standard Substrate format used by Bittensor)
- Network: TAO Mainnet (wss://entrypoint-finney.opentensor.ai:443)
- Cryptographic Algorithm: sr25519

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
- Bittensor TAO mainnet
- Substrate-based blockchains
- Polkadot ecosystem tools
- Standard SS58 address format

## API Reference

### `createNewWallet(walletName, walletPath, overwrite, isMainnet)`

Creates a new wallet with random mnemonic phrases.

Parameters:
- `walletName` (string): Name for the wallet (default: 'default')
- `walletPath` (string): Directory to store wallet files (default: './wallets')
- `overwrite` (boolean): Whether to overwrite existing files (default: true)
- `isMainnet` (boolean): Whether to create a wallet for mainnet (default: true)

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