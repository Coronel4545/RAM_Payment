document.addEventListener('DOMContentLoaded', () => {
    window.paymentProcessor = new PaymentProcessor();
});

class PaymentProcessor {
    constructor() {
        this.web3 = null;
        this.contract = null;
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
                    
                    // Função para escutar o evento com timeout
                    const escutarEvento = () => {
                        return new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                eventListener.unsubscribe();
                                reject(new Error('Tempo limite de espera do evento excedido'));
                            }, 30000); // 30 segundos de timeout

                            const eventListener = this.contract.events.WebsiteUrlReturned({
                                filter: { transactionHash: hash }
                            })
                            .on('data', (event) => {
                                clearTimeout(timeout);
                                eventListener.unsubscribe();
                                resolve(event);
                            })
                            .on('error', (error) => {
                                clearTimeout(timeout);
                                eventListener.unsubscribe();
                                reject(error);
                            });
                        });
                    };

                    try {
                        const event = await escutarEvento();
                        const url = event.returnValues.url;
                        if (url) {
                            // Toca o som da ovelha
                            const somOvelha = new Audio('sons/ovelha.mp3');
                            somOvelha.play();
                            
                            // Redireciona para a URL
                            this.redirecionarParaWebsite(url);
                        }
                    } catch (error) {
                        console.error('Erro ao escutar evento:', error);
                        mostrarMensagem('Erro ao processar redirecionamento. Por favor, aguarde um momento e tente novamente.', 'warning');
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
