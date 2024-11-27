document.addEventListener('DOMContentLoaded', () => {
    window.paymentProcessor = new PaymentProcessor();
});

class PaymentProcessor {
    constructor() {
        this.web3 = null;
        this.contract = null;
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
                
                this.contract.events.WebsiteUrlReturned({})
                    .on('data', (event) => {
                        const url = event.returnValues.url;
                        this.redirecionarParaWebsite(url);
                    })
                    .on('error', console.error);
                
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
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('Nenhuma conta encontrada');
            }

            const fromAddress = accounts[0];
            
            const result = await this.contract.methods.transferAndProcess()
                .send({ 
                    from: fromAddress,
                    gasPrice: await this.web3.eth.getGasPrice(),
                    : 20000
                })
                .on('transactionHash', (hash) => {
                    mostrarMensagem('Transação enviada! Aguarde confirmação...', 'warning');
                })
                .on('receipt', (receipt) => {
                    const evento = receipt.events.WebsiteUrlReturned;
                    if (evento) {
                        const url = evento.returnValues.url;
                        this.redirecionarParaWebsite(url);
                    }
                    mostrarMensagem('Pagamento realizado com sucesso!', 'success');
                })
                .on('error', (error) => {
                    throw error;
                });

        } catch (error) {
            console.error('Erro no pagamento:', error);
            mostrarMensagem('Erro no pagamento: ' + error.message, 'error');
        }
    }

    redirecionarParaWebsite(url) {
        try {
            const urlFormatada = url.toLowerCase().trim();
            if (!urlFormatada.startsWith('https://')) {
                throw new Error('URL inválida recebida do contrato');
            }
            
            setTimeout(() => {
                window.location.href = urlFormatada;
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao redirecionar:', error);
            mostrarMensagem('Erro ao redirecionar: ' + error.message, 'error');
        }
    }
}
