// Função para conectar carteira e verificar saldo
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

    const somOvelha = new Audio('sons/ovelha.mp3');

    try {
        // Verifica se o MetaMask está instalado
        if (typeof window.ethereum === 'undefined') {
            divAlerta.textContent = 'Por favor, instale o MetaMask para continuar!';
            document.body.appendChild(divAlerta);
            somOvelha.play();
            setTimeout(() => divAlerta.remove(), 3000);
            return;
        }

        // Verifica a rede atual
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // Se não estiver na BSC Testnet (chainId 0x61), solicita a mudança
        if (chainId !== '0x61') {
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

        // Solicita conexão da carteira
        const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (contas.length > 0) {
            const enderecoResumido = `${contas[0].substring(0, 6)}...${contas[0].substring(38)}`;
            const btnCarteira = document.getElementById('connect-wallet-btn');
            btnCarteira.textContent = enderecoResumido;
            btnCarteira.dataset.connected = "true";
            
            // Configura Web3
            const web3 = new Web3(window.ethereum);
            
            // Endereço do token RAM
            const tokenEndereco = '0xE0F956Ad00925fDCFf75F6162Eb7E00110dd0103';
            
            // ABI mínima para verificar saldo
            const minABI = [
                {
                    "constant": true,
                    "inputs": [{"name": "_owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "type": "function"
                }
            ];
            
            // Cria instância do contrato
            const contrato = new web3.eth.Contract(minABI, tokenEndereco);
            
            // Verifica saldo
            const saldo = await contrato.methods.balanceOf(contas[0]).call();
            const saldoFormatado = web3.utils.fromWei(saldo, 'ether');
            
            // Atualiza o saldo na interface
            document.getElementById('ram-balance').textContent = saldoFormatado;
            
            divAlerta.textContent = 'Carteira conectada com sucesso! 🐑';
            document.body.appendChild(divAlerta);
            setTimeout(() => divAlerta.remove(), 3000);
            
        } else {
            throw new Error('Nenhuma conta encontrada');
        }
        
    } catch (erro) {
        divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
        divAlerta.textContent = 'Erro ao conectar carteira! 🐑';
        document.body.appendChild(divAlerta);
        somOvelha.play();
        setTimeout(() => divAlerta.remove(), 3000);
        console.error(erro);
    }
}

// Função para desconectar carteira
async function desconectarCarteira() {
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

    try {
        const btnCarteira = document.getElementById('connect-wallet-btn');
        btnCarteira.textContent = 'Conectar Carteira';
        btnCarteira.dataset.connected = "false";
        document.getElementById('ram-balance').textContent = '0';
        
        divAlerta.textContent = 'Carteira desconectada com sucesso!';
        document.body.appendChild(divAlerta);
        setTimeout(() => divAlerta.remove(), 3000);
        
    } catch (erro) {
        console.error(erro);
        divAlerta.style.backgroundColor = 'rgba(139, 69, 19, 0.95)';
        divAlerta.textContent = 'Erro ao desconectar carteira!';
        document.body.appendChild(divAlerta);
        setTimeout(() => divAlerta.remove(), 3000);
    }
}

const btnCarteira = document.getElementById('connect-wallet-btn');

// Adiciona eventos de mouse hover
btnCarteira.addEventListener('mouseenter', function() {
    if (this.dataset.connected === "true") {
        this.textContent = 'Desconectar';
    }
});

btnCarteira.addEventListener('mouseleave', function() {
    if (this.dataset.connected === "true") {
        const contas = window.ethereum.request({ method: 'eth_accounts' })
            .then(contas => {
                if (contas.length > 0) {
                    const enderecoResumido = `${contas[0].substring(0, 6)}...${contas[0].substring(38)}`;
                    this.textContent = enderecoResumido;
                }
            });
    }
});

// Adiciona evento de clique
btnCarteira.addEventListener('click', function() {
    if (this.dataset.connected === "true") {
        desconectarCarteira();
    } else {
        conectarCarteira();
    }
});

// Monitora mudanças na conta
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (contas) {
        const btnCarteira = document.getElementById('connect-wallet-btn');
        if (contas.length > 0) {
            const enderecoResumido = `${contas[0].substring(0, 6)}...${contas[0].substring(38)}`;
            btnCarteira.textContent = enderecoResumido;
            btnCarteira.dataset.connected = "true";
        } else {
            btnCarteira.textContent = 'Conectar Carteira';
            btnCarteira.dataset.connected = "false";
            document.getElementById('ram-balance').textContent = '0';
        }
    });
}
