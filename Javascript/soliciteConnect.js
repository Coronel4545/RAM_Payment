let web3;
let userAccount;
let tokenContract;
let mainContract;
let provider;

async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            provider = window.ethereum;
            web3 = new Web3(provider);
            
            // Configurar para BSC Testnet
            const chainId = '0x61'; // 97 em hex
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId,
                            chainName: 'BSC Testnet',
                            nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
                            rpcUrls: [RPC_URLS[97]],
                            blockExplorerUrls: ['https://testnet.bscscan.com/']
                        }]
                    });
                }
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Web3:', error);
            return false;
        }
    } else {
        showCustomAlert('Por favor, instale uma carteira Web3 como MetaMask!');
        return false;
    }
}

async function updateBalance() {
    if (!userAccount || !tokenContract) return;
    
    try {
        const balance = await tokenContract.methods.balanceOf(userAccount).call();
        const formattedBalance = web3.utils.fromWei(balance, 'ether');
        
        const currentBalance = parseFloat(document.getElementById('ram-balance').textContent);
        const targetBalance = parseFloat(formattedBalance);
        
        animateBalance(currentBalance, targetBalance);
    } catch (error) {
        console.error('Erro ao atualizar saldo:', error);
    }
}

function animateBalance(start, end) {
    const duration = 1000;
    const startTime = performance.now();
    const balanceElement = document.getElementById('ram-balance');
    
    // Determina se é um decremento
    const isDecreasing = end < start;
    
    // Define as cores
    const startColor = isDecreasing ? '#00C851' : balanceElement.style.color || '#00C851';
    const endColor = isDecreasing ? '#ff4444' : '#00C851';
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Atualiza o número
        const current = start + (end - start) * progress;
        
        // Define o número de casas decimais
        const decimals = end === 0 ? 0 : 2; // Se for zero, não mostra decimais
        balanceElement.textContent = current.toFixed(decimals);
        
        // Atualiza a cor
        if (isDecreasing) {
            balanceElement.style.color = progress === 1 ? '#00C851' : endColor;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

async function checkAndUpdateApproval() {
    if (!userAccount || !tokenContract) return;
    
    try {
        const allowance = await tokenContract.methods.allowance(userAccount, CONTRACT_ADDRESS).call();
        const paymentBtn = document.getElementById('payment-btn');
        
        if (BigInt(allowance) < BigInt(REQUIRED_AMOUNT)) {
            paymentBtn.textContent = 'Approve';
            return false;
        } else {
            paymentBtn.textContent = 'Pay 1500 $RAM';
            return true;
        }
    } catch (error) {
        console.error('Erro ao verificar aprovação:', error);
        return false;
    }
}

async function handleApprove() {
    try {
        // Definindo valores estáticos para garantir custo de $0.40
        const gasLimit = 50000;  // Limite de gás fixo para approve
        const gasPrice = web3.utils.toWei('5', 'gwei');  // Preço do gás fixo em 5 gwei
        
        // Executa a aprovação com valores fixos
        const tx = await tokenContract.methods.approve(CONTRACT_ADDRESS, REQUIRED_AMOUNT)
            .send({ 
                from: userAccount,
                gas: gasLimit,
                gasPrice: gasPrice
            });
        
        // Verifica se a transação foi bem-sucedida
        if (tx.status) {
            // Verifica se a aprovação foi realmente concedida
            const newAllowance = await tokenContract.methods.allowance(userAccount, CONTRACT_ADDRESS).call();
            
            if (BigInt(newAllowance) >= BigInt(REQUIRED_AMOUNT)) {
                const ovelhaSound = document.getElementById('ovelha-sound');
                ovelhaSound.play();
                showCustomAlert('Aprovação realizada com sucesso!');
                await checkAndUpdateApproval();
            } else {
                showCustomAlert('Erro: Aprovação não foi concedida corretamente.');
            }
        } else {
            showCustomAlert('Erro: Transação falhou.');
        }

    } catch (error) {
        showCustomAlert('Erro na aprovação: ' + error.message);
    }
}

async function connectWallet() {
    if (await initWeb3()) {
        try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            
            // Inicializar contratos
            tokenContract = new web3.eth.Contract(TOKEN_ABI, RAM_TOKEN_ADDRESS);
            mainContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            
            // Atualizar interface
            const connectBtn = document.getElementById('connect-wallet-btn');
            connectBtn.textContent = userAccount.slice(0, 6) + '...' + userAccount.slice(-4);
            connectBtn.dataset.connected = 'true';
            
            // Configurar hover para desconectar
            connectBtn.addEventListener('mouseenter', () => {
                if (connectBtn.dataset.connected === 'true') {
                    connectBtn.textContent = 'Disconnect';
                }
            });
            
            connectBtn.addEventListener('mouseleave', () => {
                if (connectBtn.dataset.connected === 'true') {
                    connectBtn.textContent = userAccount.slice(0, 6) + '...' + userAccount.slice(-4);
                }
            });
            
            // Iniciar atualizações
            await updateBalance();
            await checkAndUpdateApproval();
            
            // Escutar eventos
            setupEventListeners();
            
            setupPaymentEventListeners();
            
            showCustomAlert('Carteira conectada com sucesso!');
        } catch (error) {
            showCustomAlert('Erro ao conectar carteira: ' + error.message);
        }
    }
}

function setupEventListeners() {
    // Escutar mudanças de conta
    provider.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            userAccount = accounts[0];
            await updateBalance();
            await checkAndUpdateApproval();
        }
    });
    
    // Escutar eventos do contrato
    mainContract.events.allEvents()
        .on('data', async () => {
            await updateBalance();
            await checkAndUpdateApproval();
        });
}

function disconnectWallet() {
    const currentBalance = parseFloat(document.getElementById('ram-balance').textContent);
    
    // Anima o saldo para 0 com cor vermelha
    animateBalance(currentBalance, 0);
    
    // Resto da lógica de desconexão
    userAccount = null;
    const connectBtn = document.getElementById('connect-wallet-btn');
    connectBtn.textContent = 'Connect';
    connectBtn.dataset.connected = 'false';
    document.getElementById('payment-btn').textContent = 'Pay 1500 $RAM';
    showCustomAlert('Carteira desconectada!');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const paymentBtn = document.getElementById('payment-btn');
    
    connectBtn.addEventListener('click', async () => {
        if (connectBtn.dataset.connected === 'false') {
            await connectWallet();
        } else {
            disconnectWallet();
        }
    });
    
    paymentBtn.addEventListener('click', async () => {
        if (paymentBtn.textContent === 'Approve') {
            await handleApprove();
        }
    });
});

function showCustomAlert(message) {
    const alertDiv = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('alert-message');
    
    // Verifica se é uma mensagem de erro
    const isError = message.toLowerCase().includes('erro') || 
                   message.toLowerCase().includes('error');
    
    // Define a cor de fundo baseado no tipo de mensagem
    alertDiv.style.background = isError ? 
        'rgba(255, 0, 0, 0.8)' :  // Vermelho para erros
        'rgba(5, 214, 40, 0.8)';  // Verde para sucesso
    
    alertMessage.textContent = message;
    alertDiv.classList.remove('d-none');
    alertDiv.classList.add('show');
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.classList.add('d-none');
    }, 3000);
}
