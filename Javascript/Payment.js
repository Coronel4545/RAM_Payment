class PaymentProcessor {
    constructor() {
        this.loadingDiv = null;
        this.sheepSound = null;
        this.web3 = null;
        this.userAddress = null;
        this.centerBottomBtn = null;
        this.contract = null;
        this.rpcUrls = [
            'https://bsc-testnet.publicnode.com',
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/'
        ];
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

            if (typeof window.ethereum !== 'undefined') {
                await this.connectToRPC();
                
                this.contract = new this.web3.eth.Contract(
                    window.CONTRACT_ABI,
                    window.CONTRACT_ADDRESS
                );

                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                this.userAddress = accounts[0];
                
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });

                if (chainId !== '0x61') {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x61' }]
                    });
                }

                mostrarMensagem('Carteira conectada com sucesso!', 'success');
                
                if (this.centerBottomBtn) {
                    this.centerBottomBtn.disabled = false;
                }
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            mostrarMensagem('Erro ao inicializar: ' + error.message, 'error');
        }
    }

    async realizarPagamento() {
        try {
            // Garantir que temos a conta atual
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('Nenhuma conta encontrada');
            }

            const fromAddress = accounts[0];
            
            // Configurar a transação
            const gasPrice = await this.web3.eth.getGasPrice();
            const adjustedGasPrice = Math.floor(Number(gasPrice) * 1.2).toString();
            
            const transactionParameters = {
                from: fromAddress,
                to: this.PROCESSOR_ADDRESS,
                gasPrice: adjustedGasPrice,
                gas: '300000', // Aumentando o limite de gas
                value: '0'
            };

            // Enviar a transação
            const tx = await this.contract.methods.processPayment()
                .send(transactionParameters)
                .on('transactionHash', (hash) => {
                    console.log('Hash da transação:', hash);
                    mostrarMensagem('Processando pagamento...', 'warning');
                });

            console.log('Transação completada:', tx);
            mostrarMensagem('Pagamento realizado com sucesso!', 'success');
            
        } catch (erro) {
            console.error('Erro no pagamento:', erro);
            mostrarMensagem('Erro no pagamento: ' + (erro.message || 'Erro desconhecido'), 'error');
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

    async connectToRPC() {
        for (const rpcUrl of this.rpcUrls) {
            try {
                this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
                await this.web3.eth.net.isListening();
                console.log(`Conectado com sucesso ao RPC: ${rpcUrl}`);
                return true;
            } catch (e) {
                console.log(`Falha ao conectar com ${rpcUrl}`);
            }
        }
        throw new Error('Não foi possível conectar a nenhum endpoint RPC');
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, criando PaymentProcessor...');
    const processor = new PaymentProcessor();
    
    // Apenas inicializa elementos básicos, SEM conectar wallet
    processor.initializeElements();
    
    // Torna acessível globalmente
    window.paymentProcessor = processor;
});

// E modifique o botão de pagamento
document.getElementById('payment-btn').addEventListener('click', async () => {
    if (!window.paymentProcessor) {
        mostrarMensagem('Erro: Processador de pagamento não inicializado', 'error');
        return;
    }

    // Se ainda não inicializou a wallet, inicializa antes do pagamento
    if (!window.paymentProcessor.web3) {
        await window.paymentProcessor.init();
    }

    window.paymentProcessor.realizarPagamento();
});
