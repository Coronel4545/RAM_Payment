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
            'https://data-seed-prebsc-1-s2.binance.org:8545/',
            'https://data-seed-prebsc-2-s2.binance.org:8545/',
            'https://data-seed-prebsc-1-s3.binance.org:8545/',
            'https://data-seed-prebsc-2-s3.binance.org:8545/'
        ];
        this.currentRpcIndex = 0;
        this.MAX_USD_COST = 5;
        this.BNB_PRICE_API = 'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT';
        this.init();
    }

    async init() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                
                this.contract = new this.web3.eth.Contract(
                    window.CONTRACT_ABI,
                    window.CONTRACT_ADDRESS
                );
                
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
}
