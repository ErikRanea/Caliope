function fetchWithTimeout(resource, options = {}, timeout = 10000) {
    return Promise.race([
        fetch(resource, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeout)
        )
    ]);
}