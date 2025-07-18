const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate, mnemonicValidate, cryptoWaitReady, mnemonicToMiniSecret } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');
const fs = require('fs').promises;
const path = require('path');

// Initialize crypto before using any cryptographic functions
async function initializeCrypto() {
    await cryptoWaitReady();
}

/**
 * Creates a new Bittensor wallet and returns address information
 * This generates a wallet compatible with the TAO mainnet using the SS58 format
 * 
 * @param {string} walletName - Name of the wallet
 * @param {string} walletPath - Path where wallet files will be stored
 * @param {boolean} overwrite - Whether to overwrite existing wallet files
 * @param {boolean} isMainnet - Whether to create a wallet for mainnet (default: true)
 * @returns {Promise<Object>} Wallet creation result
 */
async function createNewWallet(walletName = 'default', walletPath = './wallets', overwrite = true, isMainnet = true) {
    const result = {
        success: false,
        wallet_name: walletName,
        coldkey_address: '',
        hotkey_address: '',
        coldkey_mnemonic: '',
        hotkey_mnemonic: '',
        coldkey_private_key: '',
        hotkey_private_key: '',
        network: isMainnet ? 'TAO Mainnet' : 'Testnet'
    };

    try {
        // Ensure wallet directory exists
        await fs.mkdir(walletPath, { recursive: true });

        // Use the correct SS58 format for Bittensor network
        // Bittensor uses the default Substrate format (42)
        const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });

        console.log(`\nCreating Coldkey for ${result.network}`);
        // Generate coldkey mnemonic
        const coldkeyMnemonic = mnemonicGenerate(12);
        console.log(`Coldkey mnemonic: ${coldkeyMnemonic}`);
        
        // Create coldkey pair
        const coldkeyPair = keyring.addFromMnemonic(coldkeyMnemonic);
        // Extract private key from mnemonic
        const coldkeyPrivateKey = u8aToHex(mnemonicToMiniSecret(coldkeyMnemonic));
        console.log(`Coldkey private key: ${coldkeyPrivateKey}`);
        console.log(`Coldkey SS58 Address: ${coldkeyPair.address}`);
        
        console.log('\nCreating Hotkey');
        // Generate hotkey mnemonic
        const hotkeyMnemonic = mnemonicGenerate(12);
        console.log(`Hotkey mnemonic: ${hotkeyMnemonic}`);
        
        // Create hotkey pair
        const hotkeyPair = keyring.addFromMnemonic(hotkeyMnemonic);
        // Extract private key from mnemonic
        const hotkeyPrivateKey = u8aToHex(mnemonicToMiniSecret(hotkeyMnemonic));
        console.log(`Hotkey private key: ${hotkeyPrivateKey}`);
        console.log(`Hotkey SS58 Address: ${hotkeyPair.address}`);

        // Save coldkey files
        const coldkeyDir = path.join(walletPath, walletName, 'coldkey');
        await fs.mkdir(coldkeyDir, { recursive: true });
        
        const coldkeyFile = path.join(coldkeyDir, 'keyfile');
        const coldkeyData = {
            mnemonic: coldkeyMnemonic,
            address: coldkeyPair.address,
            publicKey: u8aToHex(coldkeyPair.publicKey),
            privateKey: coldkeyPrivateKey,
            created: new Date().toISOString(),
            network: result.network
        };
        
        if (overwrite || !await fileExists(coldkeyFile)) {
            await fs.writeFile(coldkeyFile, JSON.stringify(coldkeyData, null, 2));
        }

        // Save coldkeypub.txt (similar to Bittensor CLI wallet format)
        const coldkeyPubFile = path.join(coldkeyDir, 'coldkeypub.txt');
        const coldkeyPubData = {
            accountId: u8aToHex(coldkeyPair.publicKey),
            publicKey: u8aToHex(coldkeyPair.publicKey),
            privateKey: null,
            secretPhrase: null,
            secretSeed: null,
            ss58Address: coldkeyPair.address
        };
        
        if (overwrite || !await fileExists(coldkeyPubFile)) {
            await fs.writeFile(coldkeyPubFile, JSON.stringify(coldkeyPubData, null, 2));
        }

        // Save hotkey files
        const hotkeyDir = path.join(walletPath, walletName, 'hotkeys', 'default');
        await fs.mkdir(hotkeyDir, { recursive: true });
        
        const hotkeyFile = path.join(hotkeyDir, 'keyfile');
        const hotkeyData = {
            mnemonic: hotkeyMnemonic,
            address: hotkeyPair.address,
            publicKey: u8aToHex(hotkeyPair.publicKey),
            privateKey: hotkeyPrivateKey,
            created: new Date().toISOString(),
            network: result.network
        };
        
        if (overwrite || !await fileExists(hotkeyFile)) {
            await fs.writeFile(hotkeyFile, JSON.stringify(hotkeyData, null, 2));
        }

        result.success = true;
        result.coldkey_address = coldkeyPair.address;
        result.hotkey_address = hotkeyPair.address;
        result.coldkey_mnemonic = coldkeyMnemonic;
        result.hotkey_mnemonic = hotkeyMnemonic;
        result.coldkey_private_key = coldkeyPrivateKey;
        result.hotkey_private_key = hotkeyPrivateKey;

        console.log(`\nWallet '${walletName}' created successfully on ${result.network}!`);
        console.log(`Coldkey Address: ${result.coldkey_address}`);
        console.log(`Hotkey Address: ${result.hotkey_address}`);

    } catch (error) {
        result.error = error.message;
        console.error(`Error: ${error.message}`);
    }

    return result;
}

/**
 * Creates a wallet from existing mnemonic phrases
 * @param {string} walletName - Name of the wallet
 * @param {string} coldkeyMnemonic - Mnemonic phrase for coldkey
 * @param {string} hotkeyMnemonic - Mnemonic phrase for hotkey
 * @param {string} walletPath - Path where wallet files will be stored
 * @returns {Promise<Object>} Wallet restoration result
 */
async function createWalletFromMnemonic(walletName, coldkeyMnemonic, hotkeyMnemonic, walletPath = './wallets') {
    const result = {
        success: false,
        wallet_name: walletName,
        coldkey_address: '',
        hotkey_address: '',
        coldkey_private_key: '',
        hotkey_private_key: ''
    };

    try {
        // Validate mnemonics
        if (!mnemonicValidate(coldkeyMnemonic)) {
            throw new Error('Invalid coldkey mnemonic');
        }
        if (!mnemonicValidate(hotkeyMnemonic)) {
            throw new Error('Invalid hotkey mnemonic');
        }

        // Ensure wallet directory exists
        await fs.mkdir(walletPath, { recursive: true });

        const keyring = new Keyring({ type: 'sr25519' });

        // Restore coldkey from mnemonic
        const coldkeyPair = keyring.addFromMnemonic(coldkeyMnemonic);
        const coldkeyPrivateKey = u8aToHex(mnemonicToMiniSecret(coldkeyMnemonic));
        
        // Restore hotkey from mnemonic
        const hotkeyPair = keyring.addFromMnemonic(hotkeyMnemonic);
        const hotkeyPrivateKey = u8aToHex(mnemonicToMiniSecret(hotkeyMnemonic));

        // Save coldkey files
        const coldkeyDir = path.join(walletPath, walletName, 'coldkey');
        await fs.mkdir(coldkeyDir, { recursive: true });
        
        const coldkeyFile = path.join(coldkeyDir, 'keyfile');
        const coldkeyData = {
            mnemonic: coldkeyMnemonic,
            address: coldkeyPair.address,
            publicKey: u8aToHex(coldkeyPair.publicKey),
            privateKey: coldkeyPrivateKey,
            restored: new Date().toISOString()
        };
        await fs.writeFile(coldkeyFile, JSON.stringify(coldkeyData, null, 2));

        // Save hotkey files
        const hotkeyDir = path.join(walletPath, walletName, 'hotkeys', 'default');
        await fs.mkdir(hotkeyDir, { recursive: true });
        
        const hotkeyFile = path.join(hotkeyDir, 'keyfile');
        const hotkeyData = {
            mnemonic: hotkeyMnemonic,
            address: hotkeyPair.address,
            publicKey: u8aToHex(hotkeyPair.publicKey),
            privateKey: hotkeyPrivateKey,
            restored: new Date().toISOString()
        };
        await fs.writeFile(hotkeyFile, JSON.stringify(hotkeyData, null, 2));

        result.success = true;
        result.coldkey_address = coldkeyPair.address;
        result.hotkey_address = hotkeyPair.address;
        result.coldkey_private_key = coldkeyPrivateKey;
        result.hotkey_private_key = hotkeyPrivateKey;

        console.log(`Wallet '${walletName}' restored successfully!`);
        console.log(`Coldkey Address: ${result.coldkey_address}`);
        console.log(`Hotkey Address: ${result.hotkey_address}`);
        console.log(`Coldkey Private Key: ${result.coldkey_private_key}`);
        console.log(`Hotkey Private Key: ${result.hotkey_private_key}`);

    } catch (error) {
        result.error = error.message;
        console.error(`Error: ${error.message}`);
    }

    return result;
}

/**
 * Extracts private keys from an existing wallet using stored mnemonics
 * @param {string} walletName - Name of the wallet
 * @param {string} walletPath - Path where wallet files are stored
 * @returns {Promise<Object>} Private key extraction result
 */
async function getPrivateKeysFromWallet(walletName, walletPath = './wallets') {
    const result = {
        success: false,
        wallet_name: walletName,
        coldkey_private_key: '',
        hotkey_private_key: '',
        coldkey_address: '',
        hotkey_address: ''
    };

    try {
        const keyring = new Keyring({ type: 'sr25519' });

        // Read coldkey file
        const coldkeyFile = path.join(walletPath, walletName, 'coldkey', 'keyfile');
        const coldkeyData = JSON.parse(await fs.readFile(coldkeyFile, 'utf8'));
        
        // Read hotkey file
        const hotkeyFile = path.join(walletPath, walletName, 'hotkeys', 'default', 'keyfile');
        const hotkeyData = JSON.parse(await fs.readFile(hotkeyFile, 'utf8'));

        // Recreate keypairs from mnemonics to extract private keys
        const coldkeyPair = keyring.addFromMnemonic(coldkeyData.mnemonic);
        const hotkeyPair = keyring.addFromMnemonic(hotkeyData.mnemonic);

        // Extract private keys using mnemonicToMiniSecret
        result.coldkey_private_key = u8aToHex(mnemonicToMiniSecret(coldkeyData.mnemonic));
        result.hotkey_private_key = u8aToHex(mnemonicToMiniSecret(hotkeyData.mnemonic));
        result.coldkey_address = coldkeyPair.address;
        result.hotkey_address = hotkeyPair.address;
        result.success = true;

        console.log(`Private keys extracted for wallet '${walletName}':`);
        console.log(`Coldkey Private Key: ${result.coldkey_private_key}`);
        console.log(`Hotkey Private Key: ${result.hotkey_private_key}`);

    } catch (error) {
        result.error = error.message;
        console.error(`Error extracting private keys: ${error.message}`);
    }

    return result;
}

/**
 * Helper function to check if file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} Whether file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Main function to demonstrate wallet creation
 */
async function main() {
    console.log('BITTENSOR WALLET GENERATOR (Node.js) - TAO MAINNET');
    
    try {
        // Initialize cryptographic functions
        await initializeCrypto();

        // Create a new wallet for TAO mainnet
        const walletInfo = await createNewWallet('tao_mainnet_wallet', './wallets', true, true);

        if (walletInfo.success) {
            console.log('\nWALLET INFORMATION');
            console.log(`Name: ${walletInfo.wallet_name}`);
            console.log(`Network: ${walletInfo.network}`);
            console.log(`Coldkey Address: ${walletInfo.coldkey_address}`);
            console.log(`Hotkey Address: ${walletInfo.hotkey_address}`);
            
            // Save to JSON (excluding sensitive mnemonic data)
            const publicInfo = {
                wallet_name: walletInfo.wallet_name,
                network: walletInfo.network,
                coldkey_address: walletInfo.coldkey_address,
                hotkey_address: walletInfo.hotkey_address,
                created: new Date().toISOString(),
                success: walletInfo.success
            };
            
            const outputFile = `${walletInfo.wallet_name}_info.json`;
            await fs.writeFile(outputFile, JSON.stringify(publicInfo, null, 2));
            console.log(`\nWallet info saved to ${outputFile}`);
        } else {
            console.error(`Failed to create wallet: ${walletInfo.error}`);
        }
    } catch (error) {
        console.error(`Application error: ${error.message}`);
    }
}

// Export functions for use in other modules
module.exports = {
    createNewWallet,
    createWalletFromMnemonic,
    getPrivateKeysFromWallet,
    initializeCrypto
};

// Run main function if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
} 