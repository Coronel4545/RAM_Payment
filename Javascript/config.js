const CONTRACT_ADDRESS = '0x83870A1a2D81C2Bb1d76c18898eb6ad063c30e2A';
const RAM_TOKEN_ADDRESS = '0xDc42Aa304aC19F502179d63A5C8AE0f0d5c9030F';
const REQUIRED_AMOUNT = '1500000000000000000000'; // 1500 tokens

const TOKEN_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];

const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amountOut",
                "type": "uint256"
            }
        ],
        "name": "SwapExecuted",
        "type": "event"
    },
    // ... resto do ABI ...
];

window.CONTRACT_ADDRESS = CONTRACT_ADDRESS;
window.RAM_TOKEN_ADDRESS = RAM_TOKEN_ADDRESS;
window.REQUIRED_AMOUNT = REQUIRED_AMOUNT;
window.CONTRACT_ABI = CONTRACT_ABI;
window.TOKEN_ABI = TOKEN_ABI; 
