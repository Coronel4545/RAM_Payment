const WebSocket = window.WebSocket;

// Adicionar no início do arquivo
let ws;
let tentativasReconexao = 0;
const maxTentativas = 5;
const WS_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:8080'
    : 'wss://apiurl-udk0.onrender.com';

function conectarWebSocket() {
    // Verificar se já existe uma conexão ativa
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Já existe uma conexão WebSocket ativa');
        return;
    }

    try {
        console.log('Iniciando nova conexão WebSocket...', WS_URL);
        ws = new WebSocket(WS_URL);
        
        // Adicionar timeout para a conexão
        const connectionTimeout = setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                console.log('Timeout na conexão WebSocket');
                ws.close();
            }
        }, 10000); // 10 segundos de timeout

        ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('%c╔════════════════════════════════════════╗', 'color: #00ff00; font-size: 16px;');
            console.log('%c║      CONEXÃO WEBSOCKET ESTABELECIDA     ║', 'color: #00ff00; font-size: 16px;');
            console.log('%c║    Servidor: ' + WS_URL + '    ║', 'color: #00ff00; font-size: 16px;');
            console.log('%c╚════════════════════════════════════════╝', 'color: #00ff00; font-size: 16px;');
            
            // Enviar ping a cada 30 segundos para manter a conexão viva
            setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ tipo: 'ping' }));
                }
            }, 30000);
            
            tentativasReconexao = 0;
        };
        
        ws.onerror = (error) => {
            console.error('Erro na conexão WebSocket:', error);
            if (tentativasReconexao < maxTentativas) {
                console.log('Tentando reconectar após erro...');
                setTimeout(conectarWebSocket, 1000);
            }
        };

        ws.onclose = (event) => {
            console.log('Conexão WebSocket fechada. Código:', event.code, 'Razão:', event.reason);
            if (tentativasReconexao < maxTentativas) {
                tentativasReconexao++;
                console.log(`Tentativa de reconexão ${tentativasReconexao} de ${maxTentativas}`);
                setTimeout(conectarWebSocket, 3000);
            } else {
                console.error('Número máximo de tentativas de reconexão atingido');
            }
        };
    } catch (error) {
        console.error('Erro ao inicializar WebSocket:', error);
        if (tentativasReconexao < maxTentativas) {
            const tempoEspera = Math.min(1000 * Math.pow(2, tentativasReconexao), 10000);
            setTimeout(conectarWebSocket, tempoEspera);
        }
    }
}

conectarWebSocket();

// Adicionar evento ao botão
document.getElementById('center-bottom-btn').addEventListener('click', processarPagamento);

async function processarPagamento() {
    // Verificar estado da conexão WebSocket antes de prosseguir
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log('WebSocket não está conectado. Tentando reconectar...');
        await new Promise((resolve) => {
            conectarWebSocket();
            setTimeout(resolve, 2000); // Aguarda 2 segundos pela conexão
        });
        
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            throw new Error('Não foi possível estabelecer conexão com o servidor');
        }
    }

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

        // Verificar se está na rede correta (adicione o chainId da sua rede)
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x61') { // ChainId da BSC Testnet (97)
            throw new Error('Por favor, conecte-se à Binance Smart Chain Testnet');
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
                if (ws.readyState !== WebSocket.OPEN) {
                    throw new Error('Conexão WebSocket não está aberta');
                }
                
                ws.send(JSON.stringify({
                    tipo: 'processarPagamento',
                    enderecoRemetente: contas[0]
                }));
                console.log('Mensagem enviada ao servidor:', contas[0]);

                // Criar Promise para aguardar resposta do WebSocket
                const websiteUrl = await new Promise((resolve, reject) => {
                    ws.onmessage = (event) => {
                        console.log('Resposta recebida:', event.data);
                        const resposta = JSON.parse(event.data);
                        if (resposta.tipo === 'resultadoPagamento') {
                            if (resposta.sucesso && resposta.websiteUrl) {
                                console.log('URL recebida:', resposta.websiteUrl);
                                resolve(resposta.websiteUrl);
                            } else {
                                reject(new Error('URL não encontrada na resposta'));
                            }
                        }
                    };

                    // Timeout após 30 segundos
                    setTimeout(() => reject(new Error('Timeout ao aguardar URL')), 30000);
                });

                divAlerta.remove();
                window.location.href = websiteUrl;

            } catch (erro) {
                throw new Error('Erro ao recuperar URL: ' + erro.message);
            }
        }

    } catch (erro) {
        console.error('Erro detalhado:', erro);
        
        // Tratamento específico para erro de assinatura negada
        if (erro.code === 4001) {
            divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
            divAlerta.textContent = 'Transação cancelada pelo usuário';
        } else if (erro.code === -32603) {
            divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
            divAlerta.textContent = 'Erro na rede. Verifique sua conexão e tente novamente.';
        } else {
            divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
            divAlerta.textContent = `Erro no pagamento: ${erro.message}`;
        }
        
        if (document.body.contains(divAlerta)) {
            divAlerta.removeChild(loadingOvelhas);
        }
        document.body.appendChild(divAlerta);
        somOvelha.play();
        setTimeout(() => divAlerta.remove(), 3000);
    }
}

async function mudarParaBSCTestnet() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x61' }], // BSC Testnet
        });
    } catch (error) {
        // Se a rede não estiver adicionada, adiciona ela
        if (error.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x61',
                    chainName: 'BSC Testnet',
                    nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18
                    },
                    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                    blockExplorerUrls: ['https://testnet.bscscan.com']
                }]
            });
        }
    }
}

// Adicionar reconexão automática quando a página ficar visível novamente
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!ws || ws.readyState !== WebSocket.OPEN)) {
        console.log('Página visível novamente, reconectando WebSocket...');
        conectarWebSocket();
    }
});

// Iniciar conexão WebSocket quando a página carregar
window.addEventListener('load', () => {
    console.log('Página carregada, iniciando conexão WebSocket...');
    conectarWebSocket();
});

// Adicionar função para verificar status da conexão
function verificarConexaoWebSocket() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log('Conexão WebSocket perdida, tentando reconectar...');
        conectarWebSocket();
    }
}

// Verificar conexão a cada minuto
setInterval(verificarConexaoWebSocket, 60000);
