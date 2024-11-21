// Importando as dependências necessárias
const express = require('express');
const Web3 = require('web3');
const fs = require('fs');
const app = express();
const port = 3000;

// Configuração do Web3
const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545'); // Testnet BSC
const contractABI = require('./ABIRAMCEO.json'); // ABI do contrato
const contractAddress = '0xE0F956Ad00925fDCFf75F6162Eb7E00110dd0103'; // Endereço do contrato

// Middleware para processar JSON
app.use(express.json());

// Rota principal para processar pagamentos e redirecionamentos
app.post('/process-payment', async (req, res) => {
    try {
        const { userAddress } = req.body;
        
        // Instanciando o contrato
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        
        // Verificando se o pagamento foi realizado
        const events = await contract.getPastEvents('PaymentReceived', {
            filter: { payer: userAddress },
            fromBlock: 'latest'
        });

        if (events.length > 0) {
            // Obtendo a URL do website do contrato
            const websiteUrl = await contract.methods.websiteUrl().call();
            
            // Gerando um token único
            const token = Math.random().toString(36).substring(2);
            
            // Criando objeto com URL e token
            const redirectData = {
                [token]: websiteUrl
            };
            
            // Salvando no arquivo redirect.js
            fs.writeFileSync(
                'redirect.js',
                `const redirectUrls = ${JSON.stringify(redirectData, null, 2)};`
            );
            
            // Retornando o token para redirecionamento
            res.json({ 
                success: true, 
                token: token
            });
        } else {
            res.status(403).json({ 
                success: false, 
                message: 'Pagamento não encontrado' 
            });
        }
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
