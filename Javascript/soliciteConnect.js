// Função para conectar/desconectar carteira
async function conectarCarteira() {
    const divAlerta = document.createElement('div');
    divAlerta.style.cssText = `
        position: fixed;
        top: 50%;
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

    const botaoConectar = document.getElementById('connect-wallet-btn');
    
    // Se já estiver conectado, desconecta
    if (botaoConectar.getAttribute('data-connected') === 'true') {
        botaoConectar.textContent = 'Conectar Carteira';
        botaoConectar.setAttribute('data-connected', 'false');
        document.getElementById('ram-balance').textContent = '0';
        
        divAlerta.textContent = 'Carteira desconectada com sucesso!';
        document.body.appendChild(divAlerta);
        setTimeout(() => divAlerta.remove(), 3000);
        return;
    }

    // Verifica se o MetaMask está instalado
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Solicita conexão com a carteira
            const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const contaConectada = contas[0];
            
            // Atualiza o texto do botão com endereço resumido
            const enderecoResumido = `${contaConectada.substring(0, 6)}...${contaConectada.substring(38)}`;
            botaoConectar.textContent = enderecoResumido;
            botaoConectar.setAttribute('data-connected', 'true');

            // Configura o Web3
            const web3 = new Web3(window.ethereum);
            
            // Carrega os dados do contrato
            const contratoEndereco = '0xE0F956Ad00925fDCFf75F6162Eb7E00110dd0103';
            const contrato = new web3.eth.Contract(contratoABI, contratoEndereco);

            // Busca e atualiza o saldo de tokens
            const atualizarSaldo = async () => {
                const saldo = await contrato.methods.balanceOf(contaConectada).call();
                const saldoFormatado = web3.utils.fromWei(saldo, 'ether');
                document.getElementById('ram-balance').textContent = saldoFormatado;
            };

            await atualizarSaldo();
            
            // Atualiza saldo a cada 30 segundos
            setInterval(atualizarSaldo, 30000);

            return contaConectada;
        } catch (erro) {
            console.error('Erro ao conectar carteira:', erro);
            divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
            divAlerta.textContent = 'Erro ao conectar com a carteira!';
            document.body.appendChild(divAlerta);
            setTimeout(() => divAlerta.remove(), 3000);
        }
    } else {
        divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
        divAlerta.textContent = 'Por favor, instale o MetaMask!';
        document.body.appendChild(divAlerta);
        setTimeout(() => divAlerta.remove(), 3000);
    }
}

// Adiciona evento de clique ao botão
const botaoConectar = document.getElementById('connect-wallet-btn');
botaoConectar.addEventListener('click', conectarCarteira);

// Adiciona eventos de hover
botaoConectar.addEventListener('mouseenter', () => {
    if (botaoConectar.getAttribute('data-connected') === 'true') {
        botaoConectar.textContent = 'Desconectar';
    }
});

botaoConectar.addEventListener('mouseleave', () => {
    if (botaoConectar.getAttribute('data-connected') === 'true') {
        const contas = window.ethereum.request({ method: 'eth_accounts' });
        contas.then(contas => {
            if (contas.length > 0) {
                const enderecoResumido = `${contas[0].substring(0, 6)}...${contas[0].substring(38)}`;
                botaoConectar.textContent = enderecoResumido;
            }
        });
    }
});

// Monitora mudanças de conta
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (contas) {
        if (contas.length > 0) {
            const enderecoResumido = `${contas[0].substring(0, 6)}...${contas[0].substring(38)}`;
            botaoConectar.textContent = enderecoResumido;
            botaoConectar.setAttribute('data-connected', 'true');
            conectarCarteira(); // Atualiza o saldo
        } else {
            botaoConectar.textContent = 'Conectar Carteira';
            botaoConectar.setAttribute('data-connected', 'false');
            document.getElementById('ram-balance').textContent = '0';
        }
    });
}
