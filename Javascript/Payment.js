class PaymentProcessor {
    constructor() {
        this.loadingDiv = null;
        this.sheepSound = null;
        this.web3 = null;
        this.userAddress = null;
        this.centerBottomBtn = null;
    }

    async initializeElements() {
        this.loadingDiv = document.createElement('div');
        this.loadingDiv.id = 'loading-div';
        document.body.appendChild(this.loadingDiv);
        
        this.sheepSound = document.getElementById('ovelha-sound');
        this.centerBottomBtn = document.getElementById('center-bottom-btn');
        
        if (this.centerBottomBtn) {
            this.centerBottomBtn.addEventListener('click', () => {
                console.log('Botão clicado');
                this.realizarPagamento();
            });
        } else {
            console.error('Botão de pagamento não encontrado!');
        }
    }

    async init() {
        try {
            await this.initializeElements();

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
                
                if (this.centerBottomBtn) {
                    this.centerBottomBtn.disabled = false;
                }
                console.log('Carteira conectada:', this.userAddress);
            } else {
                throw new Error('MetaMask não encontrada!');
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            if (window.mostrarMensagem) {
                window.mostrarMensagem('Erro ao conectar: ' + error.message, 'error');
            }
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
            if (window.mostrarMensagem) {
                window.mostrarMensagem('Erro no pagamento: ' + error.message, 'error');
            }
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
        console.error(message);
        if (window.mostrarMensagem) {
            window.mostrarMensagem(message, 'error');
        }
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

    async desconectarCarteira() {
        try {
            // ... código de desconexão ...

            // Após desconectar, reseta o botão para "Pay 1500 $RAM"
            const btnPagamento = document.getElementById('payment-btn');
            if (btnPagamento) {
                btnPagamento.textContent = 'Pay 1500 $RAM';
            }

            // Remove os listeners antigos e adiciona o novo
            btnPagamento.replaceWith(btnPagamento.cloneNode(true));
            const newBtn = document.getElementById('payment-btn');
            newBtn.addEventListener('click', () => this.realizarPagamento());

        } catch (error) {
            console.error('Erro ao desconectar:', error);
            if (window.mostrarMensagem) {
                window.mostrarMensagem('Erro ao desconectar: ' + error.message, 'error');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM carregado, iniciando PaymentProcessor...');
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
