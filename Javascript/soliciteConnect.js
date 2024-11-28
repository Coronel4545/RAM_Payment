class WalletConnector {
    constructor() {
        this.rpcUrls = [
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/',
            'https://data-seed-prebsc-1-s2.binance.org:8545/',
            'https://data-seed-prebsc-2-s2.binance.org:8545/',
            'https://data-seed-prebsc-1-s3.binance.org:8545/',
            'https://data-seed-prebsc-2-s3.binance.org:8545/'
        ];
        this.currentRpcIndex = 0;
        this.web3 = null;
        this.init();
    }

    async init() {
        try {
            // Inicializa com o primeiro RPC
            this.web3 = new Web3(new Web3.providers.HttpProvider(this.rpcUrls[0]));
        } catch (error) {
            console.error('Erro na inicialização:', error);
        }
    }

    async setupWeb3() {
        // Tenta cada RPC até encontrar um que responda corretamente
        for (let i = 0; i < this.rpcUrls.length; i++) {
            try {
                const provider = new Web3.providers.HttpProvider(this.rpcUrls[i]);
                const web3Temp = new Web3(provider);
                
                // Testa se o RPC está respondendo
                await web3Temp.eth.getBlockNumber();
                
                this.web3 = web3Temp;
                this.currentRpcIndex = i;
                console.log(`RPC conectado com sucesso: ${this.rpcUrls[i]}`);
                return;
            } catch (error) {
                console.warn(`RPC falhou: ${this.rpcUrls[i]}`, error);
                continue;
            }
        }
        throw new Error('Nenhum RPC disponível');
    }

    async getTokenBalance(address) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                // Verifica se o web3 está inicializado
                if (!this.web3) {
                    await this.setupWeb3();
                }

                const contract = new this.web3.eth.Contract(TOKEN_ABI, RAM_TOKEN_ADDRESS);
                
                // Verifica se o contrato está acessível
                await contract.methods.decimals().call();
                
                const balance = await contract.methods.balanceOf(address).call();
                return (balance / 1e18).toFixed(3);
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts) {
                    throw error;
                }
                await this.switchRpcProvider();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo antes de tentar novamente
            }
        }
    }

    async conectarWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Garante que temos um RPC funcionando antes de prosseguir
                if (!this.web3) {
                    await this.setupWeb3();
                }

                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });

                if (accounts.length > 0) {
                    const address = accounts[0];
                    const btnCarteira = document.getElementById('connect-wallet-btn');
                    
                    try {
                        const balance = await this.getTokenBalance(address);
                        btnCarteira.textContent = `${balance} $RAM`;
                        btnCarteira.dataset.connected = "true";
                        btnCarteira.dataset.address = address;
                        this.startBalanceUpdate(address);
                        return true;
                    } catch (error) {
                        console.error('Erro ao obter saldo:', error);
                        mostrarMensagem('Erro ao carregar saldo. Tentando novamente...', 'warning');
                        await this.setupWeb3(); // Reinicializa o Web3 com um novo RPC
                        return false;
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('Erro ao conectar wallet:', error);
            mostrarMensagem('Erro ao conectar carteira: ' + error.message, 'error');
            return false;
        }
    }

    async switchRpcProvider() {
        try {
            this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcUrls.length;
            const newProvider = new Web3.providers.HttpProvider(this.rpcUrls[this.currentRpcIndex]);
            this.web3.setProvider(newProvider);
            console.log(`Alternando para RPC: ${this.rpcUrls[this.currentRpcIndex]}`);
        } catch (error) {
            console.error('Erro ao alternar RPC:', error);
        }
    }

    startBalanceUpdate(address) {
        setInterval(async () => {
            try {
                const balance = await this.getTokenBalance(address);
                const btnCarteira = document.getElementById('connect-wallet-btn');
                btnCarteira.textContent = `${balance} $RAM`;
            } catch (error) {
                console.warn('Erro ao atualizar saldo:', error);
                // Tenta alternar RPC em caso de erro
                await this.switchRpcProvider();
            }
        }, 10000); // Atualiza a cada 10 segundos
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.walletConnector = new WalletConnector();
    
    const btnCarteira = document.getElementById('connect-wallet-btn');
    if (btnCarteira) {
        btnCarteira.addEventListener('click', async () => {
            await window.walletConnector.conectarWallet();
        });
    }
});
