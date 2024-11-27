document.addEventListener('DOMContentLoaded', function() {
    const btnCarteira = document.getElementById('connect-wallet-btn');
    const btnPagamento = document.getElementById('payment-btn');
    
    // Verifica se os elementos existem antes de adicionar os eventos
    if (btnCarteira) {
        btnCarteira.addEventListener('click', async function() {
            if (btnCarteira.dataset.connected === "false") {
                await conectarCarteira();
            } else {
                await desconectarCarteira();
            }
        });
    }
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

                // Inicializa Web3 e contrato usando as constantes do config.js
                const web3 = new Web3(window.ethereum);
                const contrato = new web3.eth.Contract(TOKEN_ABI, RAM_TOKEN_ADDRESS);

                // Verifica aprovação
                await verificarAprovacao(contas[0], contrato);

                // Busca saldo
                const saldo = await contrato.methods.balanceOf(contas[0]).call();
                const saldoNumerico = Number(saldo) / 10**18;
                
                animarSaldo(saldoNumerico);
                mostrarMensagem('Carteira conectada com sucesso!', 'success');
                
                // Eventos do botão
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
    const PROCESSOR_ADDRESS = '0x83870A1a2D81C2Bb1d76c18898eb6ad063c30e2A';
    const REQUIRED_AMOUNT = '1500000000000000000000';

    try {
        const allowance = await contrato.methods.allowance(endereco, PROCESSOR_ADDRESS).call();
        const btnPagamento = document.getElementById('payment-btn');
        
        if (BigInt(allowance) < BigInt(REQUIRED_AMOUNT)) {
            btnPagamento.textContent = 'Approve';
            btnPagamento.onclick = () => aprovarTokens(contrato, PROCESSOR_ADDRESS, REQUIRED_AMOUNT);
        } else {
            btnPagamento.textContent = 'Pay 1500 $RAM';
            btnPagamento.onclick = realizarPagamento;
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

            // Reseta o botão de pagamento
            const btnPagamento = document.getElementById('payment-btn');
            if (btnPagamento) {
                btnPagamento.textContent = 'Pay 1500 $RAM';
                // Remove listeners antigos
                btnPagamento.replaceWith(btnPagamento.cloneNode(true));
                const newBtn = document.getElementById('payment-btn');
                newBtn.addEventListener('click', realizarPagamento);
            }

            // Adiciona listener para mudanças de conta
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    const btnCarteira = document.getElementById('connect-wallet-btn');
                    btnCarteira.textContent = 'Connect';
                    btnCarteira.dataset.connected = "false";
                    document.getElementById('ram-balance').textContent = '0';
                    
                    // Reseta o botão de pagamento
                    const btnPagamento = document.getElementById('payment-btn');
                    if (btnPagamento) {
                        btnPagamento.textContent = 'Pay 1500 $RAM';
                    }
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
