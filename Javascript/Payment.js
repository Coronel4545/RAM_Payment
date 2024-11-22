



// Adicionar evento ao botão
document.getElementById('center-bottom-btn').addEventListener('click', processarPagamento);

async function processarPagamento() {
    // Criar div de alerta estilizada
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

    // Substituir o elemento de loading por ovelhinhas pulando
    const loadingOvelhas = document.createElement('div');
    loadingOvelhas.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 15px auto;
    `;

    // Criar 3 ovelhinhas
    for (let i = 0; i < 3; i++) {
        const ovelha = document.createElement('div');
        ovelha.textContent = '🐑';
        ovelha.style.cssText = `
            font-size: 24px;
            animation: pular 1.2s ease-in-out infinite;
            animation-delay: ${i * 0.4}s;
        `;
        loadingOvelhas.appendChild(ovelha);
    }

    // Adicionar keyframes para animação de pulo
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pular {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
    `;
    document.head.appendChild(style);

    const somOvelha = new Audio('sons/ovelha.mp3');

    try {
        // Verificar se carteira está conectada
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask não está instalado');
        }

        const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (contas.length === 0) {
            throw new Error('Nenhuma conta encontrada');
        }

        // Configurar Web3
        const web3 = new Web3(window.ethereum);
        
        // Endereços
        const tokenAddress = '0xE0F956Ad00925fDCFf75F6162Eb7E00110dd0103';
        const contratoDestino = '0x03F4BF4398400387b2D0D38bcEb93b16806FA61d';
        
        // Valor do pagamento
        const valor = web3.utils.toWei('1500', 'ether');

        // Criar instância do contrato do token
        const minABI = [
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_to",
                        "type": "address"
                    },
                    {
                        "name": "_value",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "type": "function"
            }
        ];
        
        const contrato = new web3.eth.Contract(minABI, tokenAddress);

        // Mostrar mensagem de processamento
        divAlerta.textContent = 'PROCESSANDO';
        divAlerta.appendChild(loadingOvelhas);
        document.body.appendChild(divAlerta);

        // Executar transferência
        const transacao = await contrato.methods.transfer(contratoDestino, valor)
            .send({ from: contas[0] });

        if (transacao.status) {
            try {
                const urlCapturada = await fetch('http://localhost:3000/APIrecuver', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const dados = await urlCapturada.json();

                if (dados.url) {
                    divAlerta.remove();
                    window.location.href = dados.url;
                } else {
                    throw new Error('URL não encontrada');
                }
            } catch (erro) {
                throw new Error('Erro ao recuperar URL');
            }
        }

    } catch (erro) {
        console.error(erro);
        if (document.body.contains(divAlerta)) {
            divAlerta.removeChild(loadingOvelhas);
        }
        divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
        divAlerta.textContent = 'Erro no pagamento! 🐑';
        document.body.appendChild(divAlerta);
        somOvelha.play();
        setTimeout(() => divAlerta.remove(), 3000);
    }
}

