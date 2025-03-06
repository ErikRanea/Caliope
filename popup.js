document.addEventListener("DOMContentLoaded", () => {
    let mediaRecorder;
    let audioChunks = [];
    
    const startButton = document.getElementById("start-recording");
    const stopButton = document.getElementById("stop-recording");
    const transcriptionText = document.getElementById("transcription");
    
    startButton.addEventListener("click", async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            audioChunks = [];
            
            chrome.runtime.sendMessage({ action: "transcribeAudio", audioData: audioBlob }, response => {
                if (response.transcription) {
                    transcriptionText.innerText = response.transcription;
                } else {
                    transcriptionText.innerText = "Error en la transcripción.";
                }
            });
        };
        
        mediaRecorder.start();
        startButton.disabled = true;
        stopButton.disabled = false;
    });
    
    stopButton.addEventListener("click", () => {
        mediaRecorder.stop();
        startButton.disabled = false;
        stopButton.disabled = true;
    });
});
