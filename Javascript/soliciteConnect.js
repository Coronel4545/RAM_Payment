// Função para conectar/desconectar carteira
async function conectarCarteira() {
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

    const botaoConectar = document.getElementById('connect-wallet-btn');
    const spanSaldo = document.getElementById('ram-balance');
    
    // Se já estiver conectado, desconecta
    if (botaoConectar.getAttribute('data-connected') === 'true') {
        botaoConectar.textContent = 'Conectar Carteira';
        botaoConectar.setAttribute('data-connected', 'false');
        spanSaldo.textContent = '0';
        
        divAlerta.textContent = 'Carteira desconectada com sucesso!';
        document.body.appendChild(divAlerta);
        setTimeout(() => divAlerta.remove(), 3000);
        return;
    }

    // Verifica se o MetaMask está instalado
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Solicita conexão e aguarda resposta
            const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Solicita mudança para BSC Testnet
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x61' }], // ChainId 97 em hex para BSC Testnet
                });
            } catch (switchError) {
                // Se a rede não estiver adicionada, adiciona
                if (switchError.code === 4902) {
                    try {
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
                    } catch (addError) {
                        console.error('Erro ao adicionar rede:', addError);
                        return;
                    }
                }
            }
            
            if (contas.length > 0) {
                divAlerta.textContent = 'Carteira conectada com sucesso!';
                document.body.appendChild(divAlerta);
                setTimeout(() => divAlerta.remove(), 3000);
                
                const contaConectada = contas[0];
                
                // Atualiza o texto do botão com endereço resumido
                const enderecoResumido = `${contaConectada.substring(0, 6)}...${contaConectada.substring(38)}`;
                botaoConectar.textContent = enderecoResumido;
                botaoConectar.setAttribute('data-connected', 'true');

                // Configura o Web3 e contrato
                const web3 = new Web3(window.ethereum);
                const contratoEndereco = '0xE0F956Ad00925fDCFf75F6162Eb7E00110dd0103';
                const contrato = new web3.eth.Contract(contratoABI, contratoEndereco);

                // Função para atualizar saldo
                const atualizarSaldo = async () => {
                    try {
                        const saldo = await contrato.methods.balanceOf(contaConectada).call();
                        const saldoFormatado = parseFloat(web3.utils.fromWei(saldo, 'ether')).toFixed(2);
                        spanSaldo.textContent = saldoFormatado;
                    } catch (erro) {
                        console.error('Erro ao buscar saldo:', erro);
                        spanSaldo.textContent = '0';
                    }
                };

                // Atualiza saldo inicial
                await atualizarSaldo();
                
                // Configura atualização automática do saldo a cada 5 segundos
                const intervaloAtualizacao = setInterval(atualizarSaldo, 5000);

                // Limpa intervalo quando desconectar
                window.ethereum.on('disconnect', () => {
                    clearInterval(intervaloAtualizacao);
                    spanSaldo.textContent = '0';
                });

                return contaConectada;
            }

        } catch (erro) {
            console.error('Erro ao conectar:', erro);
            return;
        }
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
