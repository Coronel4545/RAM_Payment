// Função para obter parâmetros da URL
function obterParametroUrl(nome) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nome);
}

// Função para redirecionar com base no token
function redirecionarPorToken() {
    const token = obterParametroUrl('token');
    
    if (!token) {
        console.error('Token não encontrado na URL');
        return;
    }

    // Verifica se o token existe no objeto redirectUrls
    if (redirectUrls && redirectUrls[token]) {
        // Redireciona para a URL associada ao token
        window.location.href = redirectUrls[token];
    } else {
        console.error('URL de redirecionamento não encontrada para o token fornecido');
    }
}

// Executa o redirecionamento quando a página carregar
document.addEventListener('DOMContentLoaded', redirecionarPorToken);
