
const TOKEN_ADDRESS = '0xDc42Aa304aC19F502179d63A5C8AE0f0d5c9030F';
const TOKEN_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
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

                // Verifica aprovação
                await verificarAprovacao(contas[0], contrato);

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

async function verificarAprovacao(endereco, contrato) {
    const PROCESSOR_ADDRESS = '0x83870A1a2D81C2Bb1d76c18898eb6ad063c30e2A'; //endereço do contrato de processamento
    const REQUIRED_AMOUNT = '1500000000000000000000'; // 1500 tokens em wei

    try {
        const allowance = await contrato.methods.allowance(endereco, PROCESSOR_ADDRESS).call();
        const btnPagamento = document.getElementById('payment-btn');
        
        if (BigInt(allowance) < BigInt(REQUIRED_AMOUNT)) {
            btnPagamento.textContent = 'Approve';
            btnPagamento.onclick = () => aprovarTokens(contrato, PROCESSOR_ADDRESS, REQUIRED_AMOUNT);
        } else {
            btnPagamento.textContent = 'Pay 1500 $RAM';
            // Aqui você pode adicionar a função de pagamento
        }
    } catch (erro) {
        console.error('Erro ao verificar aprovação:', erro);
        mostrarMensagem('Erro ao verificar aprovação: ' + erro.message, 'error');
    }
}

async function aprovarTokens(contrato, spender, amount) {
    try {
        const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        await contrato.methods.approve(spender, amount)
            .send({ from: contas[0] })
            .on('transactionHash', function(hash){
                mostrarMensagem('Transação enviada! Aguarde confirmação...', 'warning');
            })
            .on('receipt', function(receipt){
                mostrarMensagem('Aprovação concedida com sucesso!', 'success');
                // Atualiza o botão após aprovação
                const btnPagamento = document.getElementById('payment-btn');
                btnPagamento.textContent = 'Pay 1500 $RAM';
                // Aqui você pode adicionar a função de pagamento
            })
            .on('error', function(error){
                mostrarMensagem('Erro na aprovação: ' + error.message, 'error');
            });
    } catch (erro) {
        console.error('Erro ao aprovar:', erro);
        mostrarMensagem('Erro ao aprovar tokens: ' + erro.message, 'error');
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
            // Limpa a interface primeiro
            const btnCarteira = document.getElementById('connect-wallet-btn');
            btnCarteira.textContent = 'Connect';
            btnCarteira.dataset.connected = "false";
            document.getElementById('ram-balance').textContent = '0';

            // Remove todos os listeners existentes
            if (window.ethereum.removeAllListeners) {
                window.ethereum.removeAllListeners();
            }

            // Método similar ao usado pela PancakeSwap
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }]
            });

            // Força a limpeza das permissões
            await window.ethereum.request({
                method: "eth_accounts"
            });

            // Verifica se realmente desconectou
            const contas = await window.ethereum.request({ 
                method: 'eth_accounts' 
            });

            if (contas.length === 0) {
                mostrarMensagem('Carteira desconectada com sucesso!', 'success');
            }

            // Adiciona listener para mudanças de conta
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

// Função para escutar eventos de Approval
function listenToApprovalEvents(tokenContract, userAddress, processorAddress) {
    // Filtro específico para os eventos de Approval que nos interessam
    const filter = {
        owner: userAddress,
        spender: processorAddress
    };

    // Escuta os eventos de Approval
    tokenContract.events.Approval({
        filter: filter,
        fromBlock: 'latest'
    })
    .on('data', async function(event) {
        console.log('Evento de Approval detectado:', event);
        
        // Verifica se o valor aprovado é suficiente
        const approvedAmount = event.returnValues.value;
        const REQUIRED_AMOUNT = '1500000000000000000000'; // 1500 tokens com 18 decimais
        
        if (BigInt(approvedAmount) >= BigInt(REQUIRED_AMOUNT)) {
            const btnPagamento = document.getElementById('payment-btn');
            btnPagamento.textContent = 'Pay 1500 $RAM';
            // Redefine o onclick para a função de pagamento
            btnPagamento.onclick = realizarPagamento;
            
            mostrarMensagem('Aprovação confirmada com sucesso!', 'success');
        }
    })
    .on('error', function(error) {
        console.error('Erro ao escutar eventos de aprovação:', error);
        mostrarMensagem('Erro ao monitorar aprovação: ' + error.message, 'error');
    });
}

// Atualizar a função conectarCarteira
async function conectarCarteira() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (contas.length > 0) {
                const web3 = new Web3(window.ethereum);
                const TOKEN_ADDRESS = '0xDc42Aa304aC19F502179d63A5C8AE0f0d5c9030F';
                const PROCESSOR_ADDRESS = '0xEnderecoDoProcessor'; // substitua pelo endereço correto
                
                const tokenContract = new web3.eth.Contract(TOKEN_ABI, TOKEN_ADDRESS);
                
                // Verifica aprovação inicial
                await verificarAprovacao(contas[0], tokenContract);
                
                // Inicia o listener de eventos
                listenToApprovalEvents(tokenContract, contas[0], PROCESSOR_ADDRESS);
                
                // ... resto do código existente ...
            }
        }
    } catch (erro) {
        console.error('Erro ao conectar:', erro);
        mostrarMensagem('Erro ao conectar carteira: ' + erro.message, 'error');
    }
}
