async function handlePayment() {
    try {
        // Verifica se está aprovado
        const isApproved = await checkAndUpdateApproval();
        if (!isApproved) {
            showCustomAlert('Erro: Aprovação necessária antes do pagamento');
            return;
        }

        // Mostra div de carregamento
        const loadingDiv = document.getElementById('loading-div');
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="sheep-container">
                    <img src="imagem/ovelha.png" alt="Ovelha" class="sheep sheep-1">
                    <img src="imagem/ovelha.png" alt="Ovelha" class="sheep sheep-2">
                    <img src="imagem/ovelha.png" alt="Ovelha" class="sheep sheep-3">
                </div>
                <div class="loading-dots">
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                    <span class="dot">.</span>
                </div>
            </div>
        `;
        loadingDiv.classList.remove('d-none');

        // Valores estáticos de gás
        const gasLimit = 100000;
        const gasPrice = web3.utils.toWei('5', 'gwei');

        // Executa o pagamento
        const tx = await mainContract.methods.transferAndProcess()
            .send({
                from: userAccount,
                gas: gasLimit,
                gasPrice: gasPrice
            });

        if (tx.status) {
            const websiteUrlEvent = tx.events.WebsiteUrlReturned;
            
            if (websiteUrlEvent && websiteUrlEvent.returnValues.user.toLowerCase() === userAccount.toLowerCase()) {
                const ovelhaSound = document.getElementById('ovelha-sound');
                ovelhaSound.play();

                showCustomAlert('Pagamento realizado com sucesso! Redirecionando...');

                let websiteUrl = websiteUrlEvent.returnValues.url;
                if (!websiteUrl.startsWith('https://')) {
                    websiteUrl = 'https://' + websiteUrl;
                }

                setTimeout(() => {
                    window.location.href = websiteUrl;
                }, 2000);
            } else {
                showCustomAlert('Erro: URL não encontrada na resposta');
            }
        } else {
            showCustomAlert('Erro: Transação falhou');
        }

    } catch (error) {
        showCustomAlert('Erro no pagamento: ' + error.message);
    } finally {
        // Esconde div de carregamento
        document.getElementById('loading-div').classList.add('d-none');
    }
}

// Atualiza o event listener no DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const paymentBtn = document.getElementById('payment-btn');
    
    paymentBtn.addEventListener('click', async () => {
        if (paymentBtn.textContent === 'Pay 1500 $RAM') {
            await handlePayment();
        }
    });
});

// Adiciona listener para eventos do contrato específicos para pagamento
function setupPaymentEventListeners() {
    mainContract.events.WebsiteUrlReturned({
        filter: { user: userAccount }
    })
    .on('data', async (event) => {
        console.log('URL Retornada:', event.returnValues.url);
    })
    .on('error', console.error);
}
