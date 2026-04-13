document.addEventListener("DOMContentLoaded", async () => {
    // DOM Elements
    const amountInput = document.getElementById("amountInput");
    const addressInput = document.getElementById("addressInput");
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const transferBtn = document.getElementById("transferBtn");
    const quoteSection = document.getElementById("quoteSection");
    const receiveAmountEl = document.getElementById("receiveAmount");
    const networkFeeEl = document.getElementById("networkFee");
    const estTimeEl = document.getElementById("estTime");
    
    const progressOverlay = document.getElementById("progressOverlay");
    const progressTitle = document.getElementById("progressTitle");
    const progressStatus = document.getElementById("progressStatus");
    const progressBar = document.getElementById("progressBar");
    
    const txInfo = document.getElementById("txInfo");
    const txHashDisplay = document.getElementById("txHashDisplay");
    const explorerLink = document.getElementById("explorerLink");
    const recentTransactionsEl = document.getElementById("recentTransactions");
    const balanceDisplay = document.getElementById("balanceDisplay");
    
    // Modal Elements
    const walletModal = document.getElementById("walletModal");
    const closeWalletModal = document.getElementById("closeWalletModal");
    const walletOptions = document.querySelectorAll(".wallet-option");
    const closeProgressBtn = document.getElementById("closeProgressBtn");

    const networks = document.querySelectorAll('.network');

    let isConnected = false;
    let selectedSource = 'arc';
    let selectedDest = 'arbitrum';
    let currentQuote = null;
    let timeoutId;
    
    let provider = null;
    let signer = null;
    let userAddress = null;
    let activeEthereum = window.ethereum; // Default

    const API_BASE = "http://127.0.0.1:8000/api";
    const ARC_CHAIN_ID_HEX = "0x4CEF52"; 
    const ARC_CHAIN_ID_DEC = 5042002;
    const ARC_CONFIG = {
        chainId: ARC_CHAIN_ID_HEX,
        chainName: "Arc Testnet",
        rpcUrls: ["https://rpc.testnet.arc.network"],
        nativeCurrency: {
            name: "USDC",
            symbol: "USDC",
            decimals: 18
        },
        blockExplorerUrls: ["https://testnet.arcscan.app"]
    };

    const RELAYER_ADDRESS = "0xa010DAbE36CAbAf7a0ca9B532beD1f31De5E5ef9";
    const USDC_ADDRESS_ARC = "0x3600000000000000000000000000000000000000";
    const USDC_ABI = [
        "function transfer(address to, uint256 amount) public returns (bool)",
        "function balanceOf(address account) public view returns (uint256)",
        "function decimals() public view returns (uint8)"
    ];

    // ----- Network Change Listener (CRITICAL) ----- //
    function setupListeners(eth) {
        if (!eth) return;
        
        eth.on("chainChanged", (chainId) => {
            console.log("[EVENT] Chain changed:", chainId);
            window.location.reload();
        });
        
        eth.on("accountsChanged", (accounts) => {
            console.log("[EVENT] Accounts changed:", accounts);
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                window.location.reload();
            }
        });
    }

    if (window.ethereum) {
        setupListeners(window.ethereum);
    }

    // ----- Auto-Connect on Load ----- //
    async function checkConnection() {
        const savedWallet = localStorage.getItem("selectedWallet");
        if (savedWallet) {
            console.log("[AUTO-CONNECT] Attempting to reconnect to:", savedWallet);
            const success = selectProvider(savedWallet);
            if (success) {
                try {
                    const accounts = await activeEthereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        await handleConnection(accounts[0]);
                    }
                } catch (err) {
                    console.error("Auto-connect check failed:", err);
                }
            }
        }
    }

    function selectProvider(walletType) {
        let eth = window.ethereum;
        
        if (walletType === 'okx') {
            eth = window.okxwallet || (window.ethereum?.isOKXWallet ? window.ethereum : null);
        } else if (walletType === 'rabby') {
            eth = window.rabby || (window.ethereum?.isRabby ? window.ethereum : null);
        } else if (walletType === 'metamask') {
            eth = window.ethereum?.isMetaMask ? window.ethereum : (window.ethereum || null);
        }
        
        if (!eth) {
            console.warn(`[PROVIDER] Requested ${walletType} but it was not found.`);
            return false;
        }
        
        activeEthereum = eth;
        setupListeners(activeEthereum);
        localStorage.setItem("selectedWallet", walletType);
        console.log(`[PROVIDER] Selected: ${walletType}`);
        return true;
    }

    async function handleConnection(address) {
        try {
            provider = new ethers.providers.Web3Provider(activeEthereum);
            signer = provider.getSigner();
            userAddress = address;
            isConnected = true;

            const shortAddr = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
            connectWalletBtn.innerText = shortAddr;
            connectWalletBtn.style.background = "var(--glass-bg)";
            connectWalletBtn.style.border = "1px solid var(--glass-border)";
            
            balanceDisplay.classList.remove("hidden");
            await refreshBalance();

            console.log("Connection established for:", userAddress);
            validateForm();
        } catch (err) {
            console.error("Connection handling error:", err);
        }
    }

    async function refreshBalance() {
        if (!provider || !userAddress) return;
        try {
            console.log("[BALANCE] Refreshing balance...");
            const balance = await provider.getBalance(userAddress);
            const formatted = parseFloat(ethers.utils.formatUnits(balance, 18)).toLocaleString(undefined, {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
            });
            balanceDisplay.innerText = `${formatted} USDC`;
            console.log("[BALANCE] Updated:", formatted);
        } catch (err) {
            console.error("[BALANCE] Failed to refresh:", err);
        }
    }

    // ----- UI Interaction Handlers ----- //

    networks.forEach(net => {
        net.addEventListener("click", (e) => {
            const el = e.target;
            const parent = el.closest('.network-selector');
            const isDest = parent.classList.contains('dest-selector');
            
            parent.querySelectorAll('.network').forEach(n => n.classList.remove('active'));
            el.classList.add('active');

            if (isDest) {
                selectedDest = el.dataset.network;
            } else {
                selectedSource = el.dataset.network;
            }
            
            debouncedFetchQuote();
        });
    });

    amountInput.addEventListener("input", debouncedFetchQuote);

    connectWalletBtn.addEventListener("click", () => {
        if (isConnected) {
            disconnectWallet();
        } else {
            walletModal.classList.remove("hidden");
        }
    });

    closeWalletModal.addEventListener("click", () => {
        walletModal.classList.add("hidden");
    });

    walletOptions.forEach(option => {
        option.addEventListener("click", async () => {
            const walletType = option.dataset.wallet;
            walletModal.classList.add("hidden");
            await connectSpecificWallet(walletType);
        });
    });

    addressInput.addEventListener("input", validateForm);

    transferBtn.addEventListener("click", initiateTransfer);

    closeProgressBtn.addEventListener("click", () => {
        progressOverlay.classList.add("hidden");
    });

    // ----- Logic ----- //

    async function connectSpecificWallet(walletType) {
        const success = selectProvider(walletType);
        if (!success) {
            alert(`Could not find ${walletType} extension. Please installation it.`);
            return;
        }

        try {
            console.log(`[CONNECT] Initiating ${walletType} connection...`);
            connectWalletBtn.innerText = "Connecting...";
            const accounts = await activeEthereum.request({ method: 'eth_requestAccounts' });
            await handleConnection(accounts[0]);
        } catch (err) {
            console.error("Connection error:", err);
            connectWalletBtn.innerText = "Connect Wallet";
            if (err.code !== 4001) {
                alert("Failed to connect wallet: " + err.message);
            }
        }
    }

    function disconnectWallet() {
        console.log("Disconnecting wallet...");
        isConnected = false;
        userAddress = null;
        signer = null;
        provider = null;
        localStorage.removeItem("selectedWallet");
        
        connectWalletBtn.innerText = "Connect Wallet";
        connectWalletBtn.style.background = "var(--accent)";
        connectWalletBtn.style.border = "none";
        balanceDisplay.classList.add("hidden");
        
        validateForm();
        console.log("Wallet disconnected.");
    }

    function debouncedFetchQuote() {
        clearTimeout(timeoutId);
        validateForm();
        const amt = parseFloat(amountInput.value);
        if (!amt || amt <= 0) {
            quoteSection.classList.remove('active');
            receiveAmountEl.innerText = "-- USDC";
            networkFeeEl.innerText = "-- USDC";
            estTimeEl.innerText = "--";
            currentQuote = null;
            return;
        }

        timeoutId = setTimeout(() => fetchQuote(amt), 500);
    }

    async function fetchQuote(amount) {
        try {
            const res = await fetch(`${API_BASE}/quote?source_chain=${selectedSource}&dest_chain=${selectedDest}&amount=${amount}`);
            const data = await res.json();

            currentQuote = data;
            quoteSection.classList.add('active');
            
            // Format for display
            const receiveFormatted = parseFloat(data.receive_amount).toLocaleString(undefined, { minimumFractionDigits: 2 });
            const feeFormatted = parseFloat(data.network_fee).toLocaleString(undefined, { minimumFractionDigits: 2 });
            
            receiveAmountEl.innerText = `${receiveFormatted} USDC`;
            networkFeeEl.innerText = `${feeFormatted} USDC`;
            estTimeEl.innerText = `~${data.estimated_time_seconds}s`;

            validateForm();
        } catch (error) {
            console.error("Quote fetch error:", error);
        }
    }

    function validateForm() {
        const amt = parseFloat(amountInput.value);
        const addr = addressInput.value.trim();
        const MIN_AMOUNT = 1.0;

        if (!isConnected) {
            transferBtn.innerText = "Connect Wallet First";
            transferBtn.disabled = true;
            return;
        }

        if (!amt || amt <= 0) {
            transferBtn.innerText = "Enter Amount";
            transferBtn.disabled = true;
            return;
        }

        if (amt < MIN_AMOUNT) {
            transferBtn.innerText = `Min Transfer: ${MIN_AMOUNT} USDC`;
            transferBtn.disabled = true;
            return;
        }

        if (addr.length < 10) {
            transferBtn.innerText = "Enter Destination Address";
            transferBtn.disabled = true;
            return;
        }

        if (!currentQuote) {
            transferBtn.innerText = "Loading Quote...";
            transferBtn.disabled = true;
            return;
        }

        transferBtn.innerText = "Sign & Transfer";
        transferBtn.disabled = false;
    }

    async function initiateTransfer() {
        console.log("[BRIDGE] Initiating Arc App Kit execution...");
        
        progressOverlay.classList.remove("hidden");
        txInfo.classList.add("hidden");
        progressTitle.innerText = "Processing Intent";
        progressStatus.innerText = "Sending request to execution layer...";
        progressBar.style.width = "20%";
        progressBar.style.background = "linear-gradient(90deg, var(--accent), #00d2ff)";

        try {
            const amount = amountInput.value;
            const receiver = addressInput.value;

            // Step 1: Ensure we are on Arc Testnet
            const network = await provider.getNetwork();
            if (network.chainId !== ARC_CHAIN_ID_DEC) {
                progressStatus.innerText = "Switching to Arc Testnet...";
                try {
                    await activeEthereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: ARC_CHAIN_ID_HEX }],
                    });
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await activeEthereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [ARC_CONFIG],
                        });
                    } else {
                        throw switchError;
                    }
                }
                // Refresh provider after network switch
                provider = new ethers.providers.Web3Provider(activeEthereum);
                signer = provider.getSigner();
            }

            // Step 2: Trigger on-chain USDC transfer from User to Relayer
            progressTitle.innerText = "Confirming Deposit";
            progressStatus.innerText = `Please sign the transfer of ${amount} USDC to the relayer.`;
            progressBar.style.width = "35%";

            const usdcContract = new ethers.Contract(USDC_ADDRESS_ARC, USDC_ABI, signer);
            const amountWei = ethers.utils.parseUnits(amount.toString(), 6); // USDC on Arc uses 6 decimals

            console.log(`[DEPOSIT] Requesting transfer of ${amount} USDC to ${RELAYER_ADDRESS}`);
            const tx = await usdcContract.transfer(RELAYER_ADDRESS, amountWei);
            
            progressStatus.innerText = "Waiting for deposit confirmation on Arc...";
            progressBar.style.width = "50%";
            
            const receipt = await tx.wait();
            console.log("[DEPOSIT] Confirmed:", receipt.transactionHash);

            // Step 3: Send intent + proof of deposit to backend
            progressTitle.innerText = "Finalizing Bridge";
            progressStatus.innerText = "Notifying execution layer...";
            progressBar.style.width = "60%";

            const response = await fetch(`${API_BASE}/intent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender: userAddress,
                    receiver: receiver,
                    amount: parseFloat(amount),
                    source_chain: selectedSource,
                    dest_chain: selectedDest,
                    user_deposit_hash: receipt.transactionHash // Sending proof of deposit
                })
            });

            if (!response.ok) throw new Error("Failed to create intent");
            const { intent_id } = await response.json();
            
            console.log("[BRIDGE] Intent created:", intent_id);
            pollStatus(intent_id);

        } catch (err) {
            console.error("Bridge error:", err);
            progressTitle.innerText = "Error";
            progressStatus.innerText = err.message || "Failed to initiate bridge.";
            progressBar.style.background = "var(--danger)";
            
            setTimeout(() => progressOverlay.classList.add("hidden"), 4000);
        }
    }

    async function pollStatus(intentId) {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/intent/${intentId}/status`);
                if (!res.ok) return;
                const data = await res.json();
                
                updateProgressUI(data);

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(interval);
                    if (data.status === 'completed') {
                        setTimeout(() => {
                            progressOverlay.classList.add("hidden");
                            amountInput.value = "";
                            refreshBalance();
                            validateForm();
                        }, 5000);
                    }
                }
            } catch (err) {
                console.warn("Status polling error:", err);
            }
        }, 3000);
    }

    function updateProgressUI(data) {
        const { status, sourceTxHash, destinationTxHash, explorerUrls } = data;
        
        switch (status) {
            case 'pending':
                progressStatus.innerText = "Intent registered...";
                progressBar.style.width = "30%";
                break;
            case 'executing':
                progressTitle.innerText = "Executing Bridge";
                progressStatus.innerText = "Arc App Kit: Initiating source transaction...";
                progressBar.style.width = "45%";
                break;
            case 'bridging':
                progressTitle.innerText = "Bridging Assets";
                progressStatus.innerText = "Waiting for destination confirmation (CCTP)...";
                progressBar.style.width = "70%";
                
                if (sourceTxHash) {
                    txInfo.classList.remove("hidden");
                    txHashDisplay.innerText = `${sourceTxHash.substring(0, 10)}...`;
                    explorerLink.href = explorerUrls.source;
                }
                break;
            case 'completed':
                progressTitle.innerText = "Transfer Complete!";
                progressStatus.innerText = "USDC has been delivered successfully.";
                progressBar.style.width = "100%";
                progressBar.style.background = "var(--success)";
                
                if (destinationTxHash) {
                    txInfo.classList.remove("hidden");
                    txHashDisplay.innerText = `Dest: ${destinationTxHash.substring(0, 10)}...`;
                    explorerLink.href = explorerUrls.destination;
                }
                break;
            case 'failed':
                progressTitle.innerText = "Bridge Failed";
                progressStatus.innerText = data.error || "Execution failed at the protocol layer.";
                progressBar.style.background = "var(--danger)";
                break;
        }

        // Save to history if we have at least a source hash
        if (data.sourceTxHash) {
            saveTransactionToHistory(data);
        }
    }

    function saveTransactionToHistory(txData) {
        const history = JSON.parse(localStorage.getItem("virex_history") || "[]");
        const existingIdx = history.findIndex(h => h.intent_id === txData.intent_id);

        const record = {
            intent_id: txData.intent_id,
            status: txData.status,
            amount: txData.input?.amount || "0.00",
            source: txData.input?.source_chain || "arc",
            dest: txData.input?.dest_chain || "ethereum",
            sourceTxHash: txData.sourceTxHash,
            destinationTxHash: txData.destinationTxHash,
            explorerUrls: txData.explorerUrls,
            timestamp: Date.now()
        };

        if (existingIdx >= 0) {
            history[existingIdx] = record;
        } else {
            history.unshift(record);
        }

        localStorage.setItem("virex_history", JSON.stringify(history.slice(0, 5)));
        renderRecentTransactions();
    }

    function renderRecentTransactions() {
        const history = JSON.parse(localStorage.getItem("virex_history") || "[]");
        
        if (history.length === 0) {
            recentTransactionsEl.innerHTML = `<p class="progress-status" style="text-align: center; padding: 1rem;">No recent transfers</p>`;
            return;
        }

        recentTransactionsEl.innerHTML = history.map(tx => {
            const displayAmount = tx.amounts?.bridge || tx.amount;
            return `
                <a href="${tx.explorerUrls?.destination || tx.explorerUrls?.source || '#'}" target="_blank" class="tx-item">
                    <div class="tx-item-header">
                        <span class="tx-item-amount">${displayAmount} USDC</span>
                        <span class="tx-item-status ${tx.status}">${tx.status}</span>
                    </div>
                    <div class="tx-item-chains">
                        ${tx.source.toUpperCase()} → ${tx.dest.toUpperCase()}
                    </div>
                </a>
            `;
        }).join('');
    }

    // Initialize UI
    renderRecentTransactions();

    // Initialize auto-connect
    await checkConnection();
});
