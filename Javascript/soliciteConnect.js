class WalletConnector {
    constructor() {
        this.rpcUrls = [
            'https://bsc-dataseed.binance.org/',
            'https://bsc-dataseed1.defibit.io/',
            'https://bsc-dataseed1.ninicoin.io/',
            'https://bsc-dataseed2.defibit.io/',
            'https://bsc-dataseed3.defibit.io/',
            'https://bsc-dataseed4.defibit.io/'
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

    async conectarWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
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
                        
                        // Atualiza o saldo periodicamente
                        this.startBalanceUpdate(address);
                        
                        return true;
                    } catch (error) {
                        // Se der erro no RPC, tenta alternar
                        await this.switchRpcProvider();
                        // Tenta novamente com o novo RPC
                        const balance = await this.getTokenBalance(address);
                        btnCarteira.textContent = `${balance} $RAM`;
                        btnCarteira.dataset.connected = "true";
                        btnCarteira.dataset.address = address;
                        
                        this.startBalanceUpdate(address);
                        return true;
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

    async getTokenBalance(address) {
        try {
            const contract = new this.web3.eth.Contract(TOKEN_ABI, RAM_TOKEN_ADDRESS);
            const balance = await contract.methods.balanceOf(address).call();
            return (balance / 1e18).toFixed(3);
        } catch (error) {
            // Se der erro no RPC, tenta alternar e tenta novamente
            await this.switchRpcProvider();
            const contract = new this.web3.eth.Contract(TOKEN_ABI, RAM_TOKEN_ADDRESS);
            const balance = await contract.methods.balanceOf(address).call();
            return (balance / 1e18).toFixed(3);
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
