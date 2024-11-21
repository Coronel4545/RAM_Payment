// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBEP20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IPancakeRouter02 {
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract PaymentProcessor {
    address public owner;
    address public tokenAddress;
    uint256 public requiredAmount;
    string public websiteUrl;
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address public constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public constant MARKETING_WALLET = 0xFEc462aCbd68148633eBaBb9291f3592dcF643d2;
    uint256 public constant TOTAL_SUPPLY = 750000000 * 10**18;
    uint256 public constant SWAP_THRESHOLD = (TOTAL_SUPPLY * 5) / 100; // 20% do supply total
    
    event PaymentReceived(address indexed payer, uint256 amount);
    event WebsiteUrlReturned(address indexed user, string url);
    event TokensSwapped(uint256 tokensSwapped, uint256 bnbReceived);

    constructor(address _tokenAddress) {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
        requiredAmount = 1500 * 10**18; // 1500 tokens considerando 18 decimais
        websiteUrl = "https://ramceo.fun"; // URL exemplo - ajuste conforme necessário
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o dono pode executar esta funcao");
        _;
    }
    function deposit() external payable {
        require(msg.value > 0, "Valor de deposito invalido");
    }
    function processPayment() external returns (string memory) {
        IBEP20 token = IBEP20(tokenAddress);
        
        require(token.transferFrom(msg.sender, address(this), requiredAmount), 
                "Falha na transferencia do token");
        
        uint256 contractBalance = token.balanceOf(address(this));
        if(contractBalance >= SWAP_THRESHOLD) {
            swapTokensForBNB();
        }
        
        emit PaymentReceived(msg.sender, requiredAmount);
        emit WebsiteUrlReturned(msg.sender, websiteUrl);
        
        return websiteUrl;
    }

    function swapTokensForBNB() internal {
        IBEP20 token = IBEP20(tokenAddress);
        uint256 tokenBalance = token.balanceOf(address(this));
        
        // Aprova o router para gastar os tokens
        token.approve(PANCAKE_ROUTER, tokenBalance);
        
        // Configura o caminho da swap
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WBNB;
        
        IPancakeRouter02 router = IPancakeRouter02(PANCAKE_ROUTER);
        
        // Executa a swap
        uint256[] memory amounts = router.swapExactTokensForETH(
            tokenBalance,
            0, // Aceita qualquer quantidade de BNB
            path,
            MARKETING_WALLET, // Envia BNB direto para a wallet de marketing
            block.timestamp + 300 // Deadline 5 minutos
        );
        
        emit TokensSwapped(amounts[0], amounts[1]);
    }

    function updateWebsiteUrl(string memory newUrl) external onlyOwner {
        websiteUrl = newUrl;
    }

    function updateRequiredAmount(uint256 newAmount) external onlyOwner {
        requiredAmount = newAmount;
    }

    function withdrawTokens() external onlyOwner {
        IBEP20 token = IBEP20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(token.transferFrom(address(this), owner, balance), 
                "Falha na retirada dos tokens");
    }
}
