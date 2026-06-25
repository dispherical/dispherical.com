async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function findNonce(challenge, difficultyPrefix = "00000") {
    let nonce = 0;
    const startTime = performance.now();
    let lastUpdateTime = startTime;

    while (true) {
        const hash = await sha256(challenge + nonce);
        if (hash.startsWith(difficultyPrefix)) {
            return nonce.toString();
        }
        nonce++;

        const currentTime = performance.now();
        if (currentTime - lastUpdateTime >= 1000) {
            const elapsedTime = (currentTime - startTime) / 1000;
            const attemptsPerSecond = Math.floor(nonce / elapsedTime);
            const estimatedTotalAttempts = Math.pow(16, difficultyPrefix.length);
            const progress = Math.min((nonce / estimatedTotalAttempts) * 100, 100).toFixed(2);
            const eta = ((estimatedTotalAttempts - nonce) / attemptsPerSecond).toFixed(2);

            document.querySelector("#email").innerText = 
                `~${progress}% done, ${attemptsPerSecond}/s, ETA: ${eta}s`;

            lastUpdateTime = currentTime;
        }
    }
}

async function decryptEmail(e) {
    e.preventDefault(); 
    const { ciphertext, iv, challenge, difficulty } = window.emailData;

    const nonce = await findNonce(challenge, difficulty);
    const keyMaterial = await sha256(challenge + nonce);
    const keyBytes = new Uint8Array(keyMaterial.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    const cryptoKey = await crypto.subtle.importKey(
        "raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]
    );
    const cipherBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) },
        cryptoKey,
        cipherBytes
    );
    document.querySelector("#email").innerHTML = "";
    document.querySelector("#email").innerText = new TextDecoder().decode(decrypted);
}
