// Configurações do Token RAM
const TOKEN_ADDRESS = '0xE0F956Ad00925fDCFf75F6162Eb7E00110dd0103';
const TOKEN_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    }
];

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    const btnCarteira = document.getElementById('connect-wallet-btn');
    
    // Adiciona o evento de clique ao botão
    btnCarteira.addEventListener('click', async function() {
        // Verifica se está conectado ou não
        if (btnCarteira.dataset.connected === "false") {
            await conectarCarteira();
        } else {
            await desconectarCarteira();
        }
    });
});

async function conectarCarteira() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (contas.length > 0) {
                const btnCarteira = document.getElementById('connect-wallet-btn');
                const enderecoResumido = `${contas[0].slice(0, 6)}...${contas[0].slice(-4)}`;
                btnCarteira.textContent = enderecoResumido;
                btnCarteira.dataset.connected = "true";
                btnCarteira.dataset.address = contas[0];

                // Inicializa Web3 e contrato
                const web3 = new Web3(window.ethereum);
                const contrato = new web3.eth.Contract(TOKEN_ABI, TOKEN_ADDRESS);

                // Busca saldo e converte para número
                const saldo = await contrato.methods.balanceOf(contas[0]).call();
                const saldoNumerico = Number(saldo) / 10**18; // Dividir por 10^18 para ajustar as casas decimais
                
                // Anima a atualização do saldo com o valor correto
                animarSaldo(saldoNumerico);
                
                mostrarMensagem('Carteira conectada com sucesso!', 'success');
                
                // Adiciona evento hover
                btnCarteira.addEventListener('mouseenter', () => {
                    if (btnCarteira.dataset.connected === "true") {
                        btnCarteira.textContent = 'Disconnect';
                    }
                });
                
                btnCarteira.addEventListener('mouseleave', () => {
                    if (btnCarteira.dataset.connected === "true") {
                        const endereco = btnCarteira.dataset.address;
                        btnCarteira.textContent = `${endereco.slice(0, 6)}...${endereco.slice(-4)}`;
                    }
                });
            }
        } else {
            mostrarMensagem('Por favor, instale o MetaMask!', 'error');
        }
    } catch (erro) {
        console.error('Erro ao conectar:', erro);
        mostrarMensagem('Erro ao conectar carteira: ' + erro.message, 'error');
    }
}

function animarSaldo(saldoFinal) {
    const elementoSaldo = document.getElementById('ram-balance');
    let saldoAtual = 0;
    const duracaoTotal = 2000; // 2 segundos
    const intervalos = 50; // Atualiza a cada 50ms
    const passos = duracaoTotal / intervalos;
    const incremento = saldoFinal / passos;

    const animacao = setInterval(() => {
        saldoAtual += incremento;
        
        if (saldoAtual >= saldoFinal) {
            elementoSaldo.textContent = Math.floor(saldoFinal).toLocaleString();
            clearInterval(animacao);
        } else {
            elementoSaldo.textContent = Math.floor(saldoAtual).toLocaleString();
        }
    }, intervalos);
}

async function desconectarCarteira() {
    try {
        if (window.ethereum) {
            // Primeiro, limpa a interface
            const btnCarteira = document.getElementById('connect-wallet-btn');
            btnCarteira.textContent = 'Connect';
            btnCarteira.dataset.connected = "false";
            document.getElementById('ram-balance').textContent = '0';

            // Remove listeners existentes
            window.ethereum.removeAllListeners?.();
            
            // Força uma nova solicitação de conexão
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{
                    eth_accounts: {}
                }]
            }).then(() => {
                // Após a solicitação, força uma desconexão
                return window.ethereum.request({
                    method: "eth_requestAccounts",
                    params: []
                });
            }).then(async () => {
                // Verifica se realmente desconectou
                const contas = await window.ethereum.request({ 
                    method: 'eth_accounts' 
                });
                
                if (contas.length === 0) {
                    mostrarMensagem('Carteira desconectada com sucesso!', 'success');
                }
            });

            // Adiciona novo listener para mudanças
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    btnCarteira.textContent = 'Connect';
                    btnCarteira.dataset.connected = "false";
                    document.getElementById('ram-balance').textContent = '0';
                }
            });

        }
    } catch (erro) {
        console.error('Erro ao desconectar:', erro);
        mostrarMensagem('Erro ao desconectar carteira: ' + erro.message, 'error');
    }
}

function mostrarMensagem(mensagem, tipo) {
    const divAlerta = document.createElement('div');
    
    // Estilos base
    const estilosBase = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px;
        border-radius: 10px;
        font-size: 18px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        min-width: 300px;
        animation: slideDown 0.5s ease-out;
    `;
    
    // Estilos específicos por tipo
    const estilosPorTipo = {
        success: `
            background-color: rgba(122, 181, 71, 0.95);
            color: #ffffff;
            border: 2px solid #4a6741;
        `,
        error: `
            background-color: rgba(181, 71, 71, 0.95);
            color: #ffffff;
            border: 2px solid #674141;
        `,
        warning: `
            background-color: rgba(181, 147, 71, 0.95);
            color: #ffffff;
            border: 2px solid #674e41;
        `
    };
    
    divAlerta.style.cssText = estilosBase + estilosPorTipo[tipo];
    divAlerta.textContent = mensagem;
    
    document.body.appendChild(divAlerta);
    setTimeout(() => {
        divAlerta.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => divAlerta.remove(), 500);
    }, 3000);
}

// Adicione estes keyframes ao seu CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, -50%);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
