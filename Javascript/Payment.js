document.addEventListener('DOMContentLoaded', () => {
    window.paymentProcessor = new PaymentProcessor();
    console.log('PaymentProcessor inicializado globalmente');
});

class PaymentProcessor {
    constructor() {
        this.web3 = null;
        this.contract = null;
    }

    async init() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                await this.connectToRPC();
                
                this.contract = new this.web3.eth.Contract(
                    window.CONTRACT_ABI,
                    window.CONTRACT_ADDRESS
                );
                
                console.log('PaymentProcessor inicializado com sucesso');
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            mostrarMensagem('Erro ao inicializar: ' + error.message, 'error');
        }
    }
}
