// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

interface IBEP20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IPancakeRouter02 {
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
}

contract RAMCEO is IBEP20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;
    
    // PancakeSwap Router e Pools
    address public pancakeswapV2Router = 0x10ED43C718714eb63d5aA57B78B54704E256024E; // Router v2
    address public pancakeswapV2Pair;
    address public constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    bool private swapping;
    uint256 public swapTokensAtAmount;
    address public changeWalletMarketing = 0xFEc462aCbd68148633eBaBb9291f3592dcF643d2;
    uint256 public buyFee;
    uint256 public sellFee; 
    uint256 public burnFee;
    address public owner = msg.sender;
    uint256 public denominator = 100;
    address public marketingWallet = payable(0x29A3ee2da349F4E237292A6029E521B247EAb533);
    address public addressNull = payable(0x0000000000000000000000000000000000000000);
    
    uint256 private constant SWAP_THRESHOLD = 20; // 20% threshold for swap
    uint256 private accumulatedFees;
    
    event SwapAndSendFees(uint256 tokensSwapped, uint256 bnbReceived);
    
    function _takeFees(address sender, address recipient, uint256 amount) private returns (uint256) {
        // Se não for compra nem venda, retorna o valor integral
        if(sender != pancakeswapV2Pair && recipient != pancakeswapV2Pair) {
            return amount;
        }

        uint256 feeAmount;
        
        if (recipient == pancakeswapV2Pair) { // Sell
            feeAmount = (amount * sellFee) / denominator;
            _balances[address(this)] += feeAmount;
            
            uint256 burnAmount = (amount * burnFee) / denominator;
            _balances[addressNull] += burnAmount;
            _totalSupply -= burnAmount;
            
            feeAmount += burnAmount;
        } else if (sender == pancakeswapV2Pair) { // Buy
            feeAmount = (amount * buyFee) / denominator;
            _balances[address(this)] += feeAmount;
        }
        
        accumulatedFees += feeAmount;
        
        // Check if accumulated fees reached threshold
        uint256 contractBalance = _balances[address(this)];
        if (contractBalance >= (_totalSupply * SWAP_THRESHOLD) / denominator) {
            _swapFeesForBNB();
        }
        
        return amount - feeAmount;
    }

    function withdrawBNB() external onlyMarketing {
        uint256 balance = address(this).balance;
        require(balance > 0, "Sem saldo em BNB para sacar");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Falha na transferencia de BNB");
    }

    
    function withdrawToken(address tokenAddress) external onlyMarketing {
        require(tokenAddress != address(0), "Endereco invalido");
        IBEP20 token = IBEP20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "Sem saldo para sacar");
        
        require(token.transfer(owner, balance), "Falha na transferencia do token");
    }

    function _swapFeesForBNB() private {
        require(!swapping, "Already swapping");
        swapping = true;
        
        uint256 tokensToSwap = _balances[address(this)];
        
        // Swap tokens for BNB using PancakeSwap
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = WBNB;
        
        // Approve router
        _approve(address(this), pancakeswapV2Router, tokensToSwap);
        
        // Execute swap
        uint256 bnbBefore = address(this).balance;
        IPancakeRouter02(pancakeswapV2Router).swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokensToSwap,
            0,
            path,
            marketingWallet,
            block.timestamp
        );
        uint256 bnbReceived = address(this).balance - bnbBefore;
        
        emit SwapAndSendFees(tokensToSwap, bnbReceived);
        
        accumulatedFees = 0;
        swapping = false;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
    modifier onlyMarketing() {
        require(msg.sender == changeWalletMarketing, "Only the marketing wallet can call this function");
        _;
    }
    function changeMarketingWallet(address newMarketingWallet) external onlyMarketing {
        marketingWallet = newMarketingWallet;
    }
    function transfer(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function renounceOwnership() external onlyOwner {
        owner = address(0);
    }
    
   function setBuyFee(uint256 newBuyFee) external onlyOwner {
    buyFee = newBuyFee;
   }
   function setSellFee(uint256 newSellFee) external onlyOwner {
    sellFee = newSellFee;
   }

   function setBurnFee(uint256 newBurnFee) external onlyOwner {
    burnFee = newBurnFee;
   }

    constructor() {
        _name = "RAMCEO";
        _symbol = "RAM";
        _decimals = 18;
        _totalSupply = 750000000 * 10**18;
        _balances[msg.sender] = _totalSupply;
        
        buyFee = 2; // 2%
        sellFee = 3; // 3%
        burnFee = 1; // 1%
        
        
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    
    function decimals() public view returns (uint8) {
        return _decimals;
    }
    
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "BEP20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }
        
        return true;
    }
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "BEP20: transfer from the zero address");
        require(recipient != address(0), "BEP20: transfer to the zero address");
        require(_balances[sender] >= amount, "BEP20: transfer amount exceeds balance");
        
        
        bool isP2P = (sender != pancakeswapV2Pair && recipient != pancakeswapV2Pair);
        
        uint256 transferAmount = amount;
        
       
        if (!isP2P) {
            uint256 burnAmount = (amount * burnFee) / 100;
            transferAmount = amount - burnAmount;
            _totalSupply -= burnAmount;
            emit Transfer(sender, address(0), burnAmount);
        }
        
        _balances[sender] -= amount;
        _balances[recipient] += transferAmount;
        
        emit Transfer(sender, recipient, transferAmount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "BEP20: approve from the zero address");
        require(spender != address(0), "BEP20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}