// Função para verificar se a carteira está conectada e processar o pagamento
async function processarPagamento() {
    const divAlerta = document.createElement('div');
    divAlerta.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        background-color: rgba(60, 90, 20, 0.95);
        color: #f4f1de;
        border: 3px solid #8b4513;
        border-radius: 10px;
        font-size: 18px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        min-width: 300px;
    `;

    const somOvelha = new Audio('sons/ovelha.mp3');

    // Verifica se o MetaMask está instalado
    if (typeof window.ethereum === 'undefined') {
        divAlerta.textContent = 'Por favor, instale o MetaMask para continuar!';
        document.body.appendChild(divAlerta);
        somOvelha.play();
        setTimeout(() => divAlerta.remove(), 3000);
        return;
    }

    try {
        // Verifica se há conta conectada
        const contas = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (contas.length === 0) {
            divAlerta.textContent = 'Por favor, conecte sua carteira primeiro!';
            document.body.appendChild(divAlerta);
            somOvelha.play();
            setTimeout(() => divAlerta.remove(), 3000);
            return;
        }

        // Se chegou aqui, a carteira está conectada
        const web3 = new Web3(window.ethereum);
        const contratoEndereco = '0xE0F956Ad00925fDCFf75F6162Eb7E00110dd0103';
        const contrato = new web3.eth.Contract(contratoABI, contratoEndereco);

        // Processa o pagamento
        try {
            const resultado = await contrato.methods.processPayment().send({
                from: contas[0]
            });
            
            divAlerta.style.backgroundColor = 'rgba(60, 90, 20, 0.95)';
            divAlerta.textContent = 'Pagamento processado com sucesso!';
            document.body.appendChild(divAlerta);
            setTimeout(() => divAlerta.remove(), 3000);
            
        } catch (erro) {
            divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
            divAlerta.textContent = 'Erro ao processar o pagamento. Tente novamente.';
            document.body.appendChild(divAlerta);
            somOvelha.play();
            setTimeout(() => divAlerta.remove(), 3000);
        }

    } catch (erro) {
        divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
        divAlerta.textContent = 'Saldo insuficiente!';
        document.body.appendChild(divAlerta);
        somOvelha.play();
        setTimeout(() => divAlerta.remove(), 3000);
    }
}

// Adiciona o evento de clique ao botão de pagamento
document.getElementById('center-bottom-btn').addEventListener('click', processarPagamento);
