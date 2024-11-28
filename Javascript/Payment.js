document.addEventListener('DOMContentLoaded', () => {
    window.paymentProcessor = new PaymentProcessor();
});

class PaymentProcessor {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.rpcUrls = [
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/',
            'https://endpoints.omniatech.io/v1/bsc/testnet/public',
            'https://bsc-testnet.publicnode.com',
            'https://bsc-testnet.public.blastapi.io'
        ];
        this.chainId = '0x61';
        this.currentRpcIndex = 0;
        this.MAX_USD_COST = 5;
        this.BNB_PRICE_API = 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT';
        this.gasLimit = 500000;
        this.eventSubscription = null;
        this.init();
    }

    async init() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                await this.verificarRede();
                this.web3 = new Web3(window.ethereum);
                
                this.contract = new this.web3.eth.Contract(
                    window.CONTRACT_ABI,
                    window.CONTRACT_ADDRESS
                );

                // Configura escuta do evento
                await this.setupEventListener();
                
                console.log('PaymentProcessor inicializado com sucesso');
                
                const btnPagamento = document.getElementById('payment-btn');
                if (btnPagamento) {
                    btnPagamento.addEventListener('click', async () => {
                        const btnCarteira = document.getElementById('connect-wallet-btn');
                        if (btnCarteira.dataset.connected !== "true") {
                            mostrarMensagem('Por favor, conecte sua carteira primeiro!', 'warning');
                            return;
                        }
                        const contrato = new this.web3.eth.Contract(TOKEN_ABI, RAM_TOKEN_ADDRESS);
                        const endereco = btnCarteira.dataset.address;
                        await verificarAprovacao(endereco, contrato);
                    });
                }
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            mostrarMensagem('Erro ao inicializar: ' + error.message, 'error');
        }
    }

    async setupEventListener() {
        try {
            // Cancela subscription anterior se existir
            if (this.eventSubscription) {
                this.eventSubscription.unsubscribe();
            }

            // Configura nova subscription
            this.eventSubscription = this.contract.events.WebsiteUrlReturned({
                fromBlock: 'latest'
            })
            .on('data', async (event) => {
                try {
                    const { returnValues } = event;
                    const { user, websiteUrl } = returnValues;
                    
                    // Verifica se o evento é para o usuário atual
                    const accounts = await this.web3.eth.getAccounts();
                    if (accounts[0].toLowerCase() === user.toLowerCase()) {
                        console.log('URL recebida do contrato:', websiteUrl);
                        await this.processarRedirecionamento(websiteUrl);
                    }
                } catch (error) {
                    console.error('Erro ao processar evento:', error);
                    mostrarMensagem('Erro ao processar resposta do contrato', 'error');
                }
            })
            .on('error', async (error) => {
                console.error('Erro na escuta do evento:', error);
                if (error.message.includes('JSON-RPC error')) {
                    await this.switchRpcProvider();
                    await this.setupEventListener(); // Tenta reconectar
                }
            });

            console.log('Listener de eventos configurado com sucesso');
        } catch (error) {
            console.error('Erro ao configurar listener:', error);
            if (error.message.includes('JSON-RPC error')) {
                await this.switchRpcProvider();
                await this.setupEventListener(); // Tenta reconectar
            }
        }
    }

    async switchRpcProvider() {
        // ... código existente do switchRpcProvider ...
        // Após trocar RPC, reconfigura o listener
        await this.setupEventListener();
    }

    async processarRedirecionamento(url) {
        try {
            if (!url) {
                throw new Error('URL não recebida do contrato');
            }

            const urlFormatada = url.trim();
            const urlPattern = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9-._]+\.[a-zA-Z]{2,}(\/\S*)?$/;
            
            if (!urlPattern.test(urlFormatada)) {
                throw new Error('URL inválida recebida do contrato');
            }

            // Reproduz som de sucesso (se existir)
            const audio = document.getElementById('success-sound');
            if (audio) {
                audio.play().catch(e => console.warn('Erro ao tocar áudio:', e));
            }

            // Redireciona após delay
            setTimeout(() => {
                window.location.href = urlFormatada;
            }, 2000);

        } catch (error) {
            console.error('Erro ao redirecionar:', error);
            mostrarMensagem('Erro ao redirecionar: ' + error.message, 'error');
        }
    }

    async realizarPagamento() {
        try {
            document.getElementById('loading-div').style.display = 'none';
            document.querySelector('.sheep-loading').style.display = 'flex';

            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('Nenhuma conta encontrada');
            }

            const fromAddress = accounts[0];
            
            // Obter preço do BNB
            const response = await fetch(this.BNB_PRICE_API);
            const data = await response.json();
            const bnbPrice = parseFloat(data.price);

            // Estimar gás
            const gasEstimado = await this.contract.methods.transferAndProcess()
                .estimateGas({ from: accounts[0] });
            
            const gasPrice = await this.web3.eth.getGasPrice();
            
            // Calcular custo em USD
            const custoWei = BigInt(gasEstimado) * BigInt(gasPrice);
            const custoBNB = Number(this.web3.utils.fromWei(custoWei.toString(), 'ether'));
            const custoUSD = custoBNB * bnbPrice;

            if (custoUSD > this.MAX_USD_COST) {
                throw new Error(`Custo da transação muito alto: $${custoUSD.toFixed(2)}`);
            }

            // Primeiro envia a transação
            const result = await this.contract.methods.transferAndProcess()
                .send({ 
                    from: fromAddress,
                    gasPrice: gasPrice,
                    gas: gasEstimado
                })
                .on('transactionHash', async (hash) => {
                    mostrarMensagem('Transação enviada! Aguarde confirmação...', 'warning');
                    
                    const buscarEvento = async () => {
                        let tentativas = 0;
                        const maxTentativas = 10;
                        const intervalo = 5000; // 5 segundos
                        
                        while (tentativas < maxTentativas) {
                            try {
                                await new Promise(resolve => setTimeout(resolve, intervalo));
                                
                                const eventos = await this.contract.getPastEvents('WebsiteUrlReturned', {
                                    filter: { 
                                        transactionHash: hash,
                                        user: fromAddress
                                    },
                                    fromBlock: 'latest'
                                });
                                
                                if (eventos && eventos.length > 0) {
                                    return eventos[0];
                                }
                                
                                tentativas++;
                            } catch (error) {
                                console.warn(`Tentativa ${tentativas + 1} falhou:`, error);
                                
                                // Tenta alternar o provedor RPC em caso de erro
                                await this.switchRpcProvider();
                                
                                tentativas++;
                            }
                        }
                        throw new Error('Não foi possível encontrar o evento após todas as tentativas');
                    };

                    try {
                        const event = await buscarEvento();
                        const url = event.returnValues.url;
                        if (url) {
                            // Toca o som da ovelha
                            const somOvelha = new Audio('sons/ovelha.mp3');
                            somOvelha.play();
                            
                            // Redireciona para a URL
                            this.redirecionarParaWebsite(url);
                        }
                    } catch (error) {
                        console.error('Erro ao buscar evento:', error);
                        mostrarMensagem('Por favor, aguarde. O redirecionamento pode levar alguns instantes...', 'warning');
                    }
                })
                .on('receipt', (receipt) => {
                    document.querySelector('.sheep-loading').style.display = 'none';
                    mostrarMensagem('Pagamento realizado com sucesso!', 'success');
                })
                .on('error', (error) => {
                    document.querySelector('.sheep-loading').style.display = 'none';
                    throw error;
                });

        } catch (error) {
            document.querySelector('.sheep-loading').style.display = 'none';
            console.error('Erro no pagamento:', error);
            mostrarMensagem('Erro no pagamento: ' + error.message, 'error');
        }
    }

    redirecionarParaWebsite(url) {
        try {
            // Validação inicial da URL
            if (!url || typeof url !== 'string') {
                throw new Error('URL inválida ou não fornecida');
            }

            // Tratamento da URL
            let urlFormatada = url.toLowerCase().trim();
            
            // Remove protocolos existentes e www
            urlFormatada = urlFormatada.replace(/^(https?:\/\/|\/\/|www\.)/i, '');
            
            // Adiciona https:// no início
            urlFormatada = 'https://' + urlFormatada;
            
            // Validação mais rigorosa da URL formatada
            const urlPattern = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9-._]+\.[a-zA-Z]{2,}(\/\S*)?$/;
            if (!urlPattern.test(urlFormatada)) {
                throw new Error('URL inválida recebida do contrato');
            }
            
            // Log para debug (opcional)
            console.log('URL original:', url);
            console.log('URL formatada:', urlFormatada);
            
            // Redireciona após delay para garantir que o som seja tocado
            setTimeout(() => {
                window.location.href = urlFormatada;
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao redirecionar:', error);
            mostrarMensagem('Erro ao redirecionar: ' + error.message, 'error');
        }
    }

    async processPayment(endereco, contrato) {
        try {
            // Verifica rede antes do pagamento
            await this.verificarRede();
            
            const gasPrice = await this.web3.eth.getGasPrice();
            const tx = {
                from: endereco,
                to: contrato,
                gasPrice: gasPrice,
                gas: this.gasLimit,
                value: '0', // Valor em wei
                data: this.contract.methods.processPayment().encodeABI()
            };

            const receipt = await this.web3.eth.sendTransaction(tx);
            return receipt;
        } catch (error) {
            if (error.message.includes('JSON-RPC error')) {
                await this.switchRpcProvider();
                return this.processPayment(endereco, contrato);
            }
            throw error;
        }
    }

    async verificarAprovacao(endereco, contrato) {
        try {
            await this.verificarRede();
            const allowance = await this.contract.methods
                .allowance(endereco, contrato)
                .call();
            return allowance;
        } catch (error) {
            if (error.message.includes('JSON-RPC error')) {
                await this.switchRpcProvider();
                return this.verificarAprovacao(endereco, contrato);
            }
            throw error;
        }
    }

    async verificarRede() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask não encontrada');
            }
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== this.chainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: this.chainId }]
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
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
                    } else {
                        throw switchError;
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Erro ao verificar/trocar rede:', error);
            throw error;
        }
    }
}
