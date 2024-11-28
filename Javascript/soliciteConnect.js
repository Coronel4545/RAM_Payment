class WalletConnector {
    constructor() {
        this.rpcUrls = [
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/',
            'https://endpoints.omniatech.io/v1/bsc/testnet/public',
            'https://bsc-testnet.publicnode.com',
            'https://bsc-testnet.public.blastapi.io'
        ];
        this.chainId = '0x61';
        this.currentRpcIndex = 0;
        this.web3 = null;
        this.gasLimit = 500000;
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
        try {
            await this.verificarRede();
            const contract = new this.web3.eth.Contract(
                window.TOKEN_ABI,
                window.TOKEN_ADDRESS
            );
            const balance = await contract.methods.balanceOf(address).call();
            return this.web3.utils.fromWei(balance);
        } catch (error) {
            if (error.message.includes('JSON-RPC error')) {
                await this.switchRpcProvider();
                return this.getTokenBalance(address);
            }
            throw error;
        }
    }

    async conectarWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask não encontrada');
            }

            // Solicita contas
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('Nenhuma conta autorizada');
            }

            // Verifica e troca rede se necessário
            await this.verificarRede();

            // Atualiza botão
            const btnCarteira = document.getElementById('connect-wallet-btn');
            if (btnCarteira) {
                btnCarteira.dataset.connected = "true";
                btnCarteira.dataset.address = accounts[0];
                btnCarteira.textContent = accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4);
            }

            // Inicia monitoramento de saldo
            this.iniciarMonitoramentoSaldo(accounts[0]);

            return accounts[0];
        } catch (error) {
            console.error('Erro ao conectar wallet:', error);
            mostrarMensagem('Erro ao conectar carteira: ' + error.message, 'error');
            return false;
        }
    }

    async switchRpcProvider() {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcUrls.length;
            
            const provider = new Web3.providers.HttpProvider(this.rpcUrls[this.currentRpcIndex], {
                timeout: 10000,
                headers: [
                    {
                        name: 'Cache-Control',
                        value: 'no-cache'
                    }
                ]
            });

            const web3Temp = new Web3(provider);
            await web3Temp.eth.getBlockNumber();
            
            this.web3.setProvider(provider);
            console.log(`RPC alternado para: ${this.rpcUrls[this.currentRpcIndex]}`);
            
            return true;
        } catch (error) {
            console.warn(`Falha no RPC ${this.rpcUrls[this.currentRpcIndex]}:`, error);
            if (this.currentRpcIndex < this.rpcUrls.length - 1) {
                return this.switchRpcProvider();
            }
            throw new Error('Todos os RPCs falharam');
        }
    }

    async verificarRede() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== this.chainId) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: this.chainId }],
                });
            }
        } catch (error) {
            if (error.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: this.chainId,
                        chainName: 'BSC Testnet',
                        nativeCurrency: {
                            name: 'tBNB',
                            symbol: 'tBNB',
                            decimals: 18
                        },
                        rpcUrls: this.rpcUrls,
                        blockExplorerUrls: ['https://testnet.bscscan.com/']
                    }]
                });
            }
            throw error;
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
