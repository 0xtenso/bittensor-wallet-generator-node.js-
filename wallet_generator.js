const { Keyring } = require('@polkadot/keyring');
const { mnemonicGenerate, mnemonicValidate, cryptoWaitReady } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');
const fs = require('fs').promises;
const path = require('path');

// Initialize crypto before using any cryptographic functions
async function initializeCrypto() {
    await cryptoWaitReady();
}

/**
 * Creates a new Bittensor wallet and returns address information
 * @param {string} walletName - Name of the wallet
 * @param {string} walletPath - Path where wallet files will be stored
 * @param {boolean} overwrite - Whether to overwrite existing wallet files
 * @returns {Promise<Object>} Wallet creation result
 */
async function createNewWallet(walletName = 'default', walletPath = './wallets', overwrite = true) {
    const result = {
        success: false,
        wallet_name: walletName,
        coldkey_address: '',
        hotkey_address: '',
        coldkey_mnemonic: '',
        hotkey_mnemonic: ''
    };

    try {
        // Ensure wallet directory exists
        await fs.mkdir(walletPath, { recursive: true });

        const keyring = new Keyring({ type: 'sr25519' });

        console.log('\nCreating Coldkey');
        // Generate coldkey mnemonic
        const coldkeyMnemonic = mnemonicGenerate(12);
        console.log(`Coldkey mnemonic: ${coldkeyMnemonic}`);
        
        // Create coldkey pair
        const coldkeyPair = keyring.addFromMnemonic(coldkeyMnemonic);
        
        console.log('\nCreating Hotkey');
        // Generate hotkey mnemonic
        const hotkeyMnemonic = mnemonicGenerate(12);
        console.log(`Hotkey mnemonic: ${hotkeyMnemonic}`);
        
        // Create hotkey pair
        const hotkeyPair = keyring.addFromMnemonic(hotkeyMnemonic);

        // Save coldkey files
        const coldkeyDir = path.join(walletPath, walletName, 'coldkey');
        await fs.mkdir(coldkeyDir, { recursive: true });
        
        const coldkeyFile = path.join(coldkeyDir, 'keyfile');
        const coldkeyData = {
            mnemonic: coldkeyMnemonic,
            address: coldkeyPair.address,
            publicKey: u8aToHex(coldkeyPair.publicKey),
            created: new Date().toISOString()
        };
        
        if (overwrite || !await fileExists(coldkeyFile)) {
            await fs.writeFile(coldkeyFile, JSON.stringify(coldkeyData, null, 2));
        }

        // Save hotkey files
        const hotkeyDir = path.join(walletPath, walletName, 'hotkeys', 'default');
        await fs.mkdir(hotkeyDir, { recursive: true });
        
        const hotkeyFile = path.join(hotkeyDir, 'keyfile');
        const hotkeyData = {
            mnemonic: hotkeyMnemonic,
            address: hotkeyPair.address,
            publicKey: u8aToHex(hotkeyPair.publicKey),
            created: new Date().toISOString()
        };
        
        if (overwrite || !await fileExists(hotkeyFile)) {
            await fs.writeFile(hotkeyFile, JSON.stringify(hotkeyData, null, 2));
        }

        result.success = true;
        result.coldkey_address = coldkeyPair.address;
        result.hotkey_address = hotkeyPair.address;
        result.coldkey_mnemonic = coldkeyMnemonic;
        result.hotkey_mnemonic = hotkeyMnemonic;

        console.log(`\nWallet '${walletName}' created successfully!`);
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
        hotkey_address: ''
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
        
        // Restore hotkey from mnemonic
        const hotkeyPair = keyring.addFromMnemonic(hotkeyMnemonic);

        // Save coldkey files
        const coldkeyDir = path.join(walletPath, walletName, 'coldkey');
        await fs.mkdir(coldkeyDir, { recursive: true });
        
        const coldkeyFile = path.join(coldkeyDir, 'keyfile');
        const coldkeyData = {
            mnemonic: coldkeyMnemonic,
            address: coldkeyPair.address,
            publicKey: u8aToHex(coldkeyPair.publicKey),
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
            restored: new Date().toISOString()
        };
        await fs.writeFile(hotkeyFile, JSON.stringify(hotkeyData, null, 2));

        result.success = true;
        result.coldkey_address = coldkeyPair.address;
        result.hotkey_address = hotkeyPair.address;

        console.log(`Wallet '${walletName}' restored successfully!`);
        console.log(`Coldkey Address: ${result.coldkey_address}`);
        console.log(`Hotkey Address: ${result.hotkey_address}`);

    } catch (error) {
        result.error = error.message;
        console.error(`Error: ${error.message}`);
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
    console.log('BITTENSOR WALLET GENERATOR (Node.js)');
    
    try {
        // Initialize cryptographic functions
        await initializeCrypto();

        // Create a new wallet
        const walletInfo = await createNewWallet('test_wallet');

        if (walletInfo.success) {
            console.log('WALLET INFORMATION');
            console.log(`Name: ${walletInfo.wallet_name}`);
            console.log(`Coldkey Address: ${walletInfo.coldkey_address}`);
            console.log(`Hotkey Address: ${walletInfo.hotkey_address}`);
            
            // Save to JSON (excluding sensitive mnemonic data)
            const publicInfo = {
                wallet_name: walletInfo.wallet_name,
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
    initializeCrypto
};

// Run main function if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
} 