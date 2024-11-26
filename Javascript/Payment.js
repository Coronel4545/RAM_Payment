const CONTRACT_ADDRESS = '0x83870A1a2D81C2Bb1d76c18898eb6ad063c30e2A';
const RAM_TOKEN_ADDRESS = '0xDc42Aa304aC19F502179d63A5C8AE0f0d5c9030F';
const REQUIRED_AMOUNT = '1500000000000000000000'; // 1500 tokens com 18 decimais

const TOKEN_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "tokensSwapped",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "bnbReceived",
                "type": "uint256"
            }
        ],
        "name": "SwapAndSendFees",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "BUSD",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WBNB",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "addressNull",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address","name": "owner","type": "address"},
            {"internalType": "address","name": "spender","type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address","name": "spender","type": "address"},
            {"internalType": "uint256","name": "amount","type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool","name": "","type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address","name": "account","type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address","name": "recipient","type": "address"},
            {"internalType": "uint256","name": "amount","type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"internalType": "bool","name": "","type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address","name": "sender","type": "address"},
            {"internalType": "address","name": "recipient","type": "address"},
            {"internalType": "uint256","name": "amount","type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [{"internalType": "bool","name": "","type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "address","name": "_tokenAddress","type": "address"}],
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
                "internalType": "string",
                "name": "url",
                "type": "string"
            }
        ],
        "name": "WebsiteUrlReturned",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "PANCAKE_ROUTER",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "REQUIRED_AMOUNT",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WBNB",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "denominator",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pancakeRouter",
        "outputs": [{"internalType": "contract IPancakeRouter02","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "percent",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address","name": "_newOwner","type": "address"}],
        "name": "setNewOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "_percent","type": "uint256"}],
        "name": "setPercent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address","name": "_tokenAddress","type": "address"}],
        "name": "setTokenAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address payable","name": "_wallet","type": "address"}],
        "name": "setWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string","name": "_url","type": "string"}],
        "name": "setWebsiteUrl",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "token",
        "outputs": [{"internalType": "contract IBEP20","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "total_Supply",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "transferAndProcess",
        "outputs": [{"internalType": "string","name": "","type": "string"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "wallet",
        "outputs": [{"internalType": "address payable","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "websiteUrl",
        "outputs": [{"internalType": "string","name": "","type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "amount","type": "uint256"}],
        "name": "withdrawBNB",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "amount","type": "uint256"}],
        "name": "withdrawTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

class PaymentProcessor {
    constructor() {
        this.loadingDiv = document.createElement('div');
        this.loadingDiv.id = 'loading-div';
        document.body.appendChild(this.loadingDiv);
        
        this.sheepSound = document.getElementById('ovelha-sound');
        this.web3 = null;
        this.userAddress = null;
        this.centerBottomBtn = document.getElementById('center-bottom-btn');
        
        this.centerBottomBtn.addEventListener('click', () => {
            console.log('Botão clicado');
            this.realizarPagamento();
        });
    }

    async init() {
        try {
            console.log('Iniciando conexão com MetaMask...');
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                this.web3 = new Web3(window.ethereum);
                this.userAddress = accounts[0];
                
                const chainId = await this.web3.eth.getChainId();
                console.log('Chain ID:', chainId);
                
                if (chainId !== 97) {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x61' }],
                    });
                }
                
                this.centerBottomBtn.disabled = false;
                console.log('Carteira conectada:', this.userAddress);
            } else {
                throw new Error('MetaMask não encontrada!');
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showError('Erro ao conectar: ' + error.message);
            this.centerBottomBtn.disabled = true;
        }
    }

    async realizarPagamento() {
        try {
            const REQUIRED_AMOUNT = '1500000000000000000000'; // 1500 tokens
            
            // Instancia o contrato do token RAM
            const tokenContract = new this.web3.eth.Contract(
                TOKEN_ABI,
                RAM_TOKEN_ADDRESS
            );

            // Primeiro aprova o contrato para transferir os tokens
            console.log('Aprovando transferência...');
            await tokenContract.methods.approve(CONTRACT_ADDRESS, REQUIRED_AMOUNT)
                .send({
                    from: this.userAddress
                });

            // Executa a transferência e processamento em uma única transação
            const paymentContract = new this.web3.eth.Contract(
                CONTRACT_ABI,
                CONTRACT_ADDRESS
            );

            console.log('Executando transferência e processamento...');
            const result = await paymentContract.methods.transferAndProcess()
                .send({
                    from: this.userAddress,
                    gasLimit: 300000
                });

            // Faz a requisição para o servidor para obter a URL
            const response = await fetch('https://back-end-flzz.onrender.com/api/get-website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transactionHash: result.transactionHash
                })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('URL não encontrada');
            }

        } catch (error) {
            console.error('Erro no pagamento:', error);
            this.showError('Erro no pagamento: ' + error.message);
        }
    }

    showLoading() {
        this.loadingDiv.innerHTML = `
            <div class="loading-container">
                <div class="wool-background">
                    <div class="jumping-sheep-container">
                        <div class="sheep-wrapper">
                            <img src="imagem/ovelha.png" class="jumping-sheep" alt="ovelha">
                        </div>
                        <div class="sheep-wrapper">
                            <img src="imagem/ovelha.png" class="jumping-sheep" alt="ovelha">
                        </div>
                        <div class="sheep-wrapper">
                            <img src="imagem/ovelha.png" class="jumping-sheep" alt="ovelha">
                        </div>
                    </div>
                    <p class="rustic-text">Processando pagamento...</p>
                </div>
            </div>
        `;
        this.loadingDiv.style.display = 'block';
    }

    showSuccess() {
        this.loadingDiv.innerHTML = `
            <div class="success-container">
                <div class="wool-background">
                    <div class="check-mark">✓</div>
                    <p class="rustic-text">Pagamento realizado com sucesso!</p>
                </div>
            </div>
        `;
    }

    showError(message) {
        this.loadingDiv.innerHTML = `
            <div class="error-container">
                <div class="wool-background">
                    <div class="error-mark">✗</div>
                    <p class="rustic-text">${message}</p>
                </div>
            </div>
        `;
    }

    hideLoading() {
        setTimeout(() => {
            this.loadingDiv.style.display = 'none';
        }, 3000);
    }

    async displayGasEstimate() {
        try {
            const gasPrice = await this.web3.eth.getGasPrice();
            const gasEstimateTotal = await this.estimateTotalGas();
            const totalCostWei = BigInt(gasPrice) * BigInt(gasEstimateTotal);
            const totalCostBNB = this.web3.utils.fromWei(totalCostWei.toString(), 'ether');
            
            document.getElementById('gas-estimate').textContent = 
                `Custo estimado: ${totalCostBNB} BNB`;
        } catch (error) {
            console.error('Erro ao calcular estimativa:', error);
        }
    }

    async estimateTotalGas() {
        const tokenContract = new this.web3.eth.Contract(TOKEN_ABI, RAM_TOKEN_ADDRESS);
        
        const approveGas = await tokenContract.methods.approve(CONTRACT_ADDRESS, REQUIRED_AMOUNT)
            .estimateGas({ from: this.userAddress });
        const transferGas = await tokenContract.methods.transfer(CONTRACT_ADDRESS, REQUIRED_AMOUNT)
            .estimateGas({ from: this.userAddress });
            
        return approveGas + transferGas;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const processor = new PaymentProcessor();
    await processor.init();
    window.paymentProcessor = processor;
});

const styles = `
    .loading-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        background: #f4d03f;
        border: 8px solid #8b4513;
        box-shadow: 0 0 20px rgba(139, 69, 19, 0.4);
    }

    .wool-background {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 10px;
        padding: 20px;
        position: relative;
        overflow: hidden;
    }

    .wool-background::before {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="white" opacity="0.5"/></svg>') repeat;
        z-index: -1;
        opacity: 0.3;
    }

    .jumping-sheep-container {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-bottom: 20px;
    }

    .sheep-wrapper {
        position: relative;
    }

    .jumping-sheep {
        width: 40px;
        height: 40px;
        animation: slowJump 2s infinite ease-in-out;
        display: inline-block;
    }

    .jumping-sheep:nth-child(1) {
        animation-delay: 0s;
    }

    .jumping-sheep:nth-child(2) {
        animation-delay: 0.6s;
    }

    .jumping-sheep:nth-child(3) {
        animation-delay: 1.2s;
    }

    .rustic-text {
        font-family: 'Helvetica Neue', sans-serif;
        color: #8b4513;
        font-size: 1.2em;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        margin-top: 15px;
    }

    .check-mark {
        color: #2ecc71;
        font-size: 48px;
        margin-bottom: 15px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .error-mark {
        color: #e74c3c;
        font-size: 48px;
        margin-bottom: 15px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    @keyframes slowJump {
        0%, 100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-20px);
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

window.addEventListener('load', async () => {
    console.log('Página carregada, iniciando PaymentProcessor...');
    const paymentProcessor = new PaymentProcessor();
    await paymentProcessor.init();
});
