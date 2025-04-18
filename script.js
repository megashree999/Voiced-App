document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const recordBtn = document.getElementById('recordBtn');
    const textDisplay = document.getElementById('textDisplay');
    const languageSelect = document.getElementById('languageSelect');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeModal = document.querySelector('.close-modal');
    const notification = document.getElementById('notification');
    const visualizer = document.getElementById('visualizer');
    const bars = document.querySelectorAll('.visualizer .bar');
    const timeStat = document.getElementById('timeStat');
    const wordsStat = document.getElementById('wordsStat');
    const accuracyStat = document.getElementById('accuracyStat');
    const themeSwitch = document.getElementById('theme-switch');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isRecording = false;
    let recordingStartTime;
    let timerInterval;
    let finalTranscript = '';
    let confidenceSum = 0;
    let resultCount = 0;

    initSpeechRecognition();
    setupEventListeners();
    initParticles();
    checkThemePreference();

    function initSpeechRecognition() {
        if (!SpeechRecognition) {
            showNotification('Speech recognition not supported in your browser', 'error');
            recordBtn.disabled = true;
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageSelect.value;

        recognition.onstart = () => {
            isRecording = true;
            recordBtn.classList.add('recording');
            recordingStartTime = new Date();
            startTimer();
            animateVisualizer();
            showNotification('Recording started', 'success');
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            } else {
                recordBtn.classList.remove('recording');
                stopTimer();
                stopVisualizer();
            }
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const confidence = event.results[i][0].confidence;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                    confidenceSum += confidence;
                    resultCount++;
                    updateAccuracyStat();
                } else {
                    interimTranscript += transcript;
                }
            }

            const placeholder = textDisplay.querySelector('.placeholder');
            if (placeholder) {
                textDisplay.removeChild(placeholder);
            }

            textDisplay.innerHTML = finalTranscript + '<span style="color: #999">' + interimTranscript + '</span>';
            updateWordsStat();
            scrollToBottom();
        };

        recognition.onerror = (event) => {
            showNotification(`Error occurred: ${event.error}`, 'error');
            stopRecording();
        };
    }

    function setupEventListeners() {
        recordBtn.addEventListener('click', toggleRecording);
        languageSelect.addEventListener('change', () => {
            if (recognition) {
                recognition.lang = languageSelect.value;
                showNotification(`Language set to ${languageSelect.options[languageSelect.selectedIndex].text}`, 'success');
            }
        });
        copyBtn.addEventListener('click', copyText);
        clearBtn.addEventListener('click', clearText);
        downloadBtn.addEventListener('click', downloadText);
        helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
        closeModal.addEventListener('click', () => helpModal.classList.remove('show'));
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('show');
            }
        });
        themeSwitch.addEventListener('change', toggleTheme);
    }

    function toggleRecording() {
        if (isRecording) {
            pauseRecording();
        } else {
            startRecording();
        }
        
        
    }
    function pauseRecording() {
        isRecording = false;
        recognition.stop();
        showNotification('Recording paused', 'info');
    }
    

    function startRecording() {
        finalTranscript = '';
        confidenceSum = 0;
        resultCount = 0;
        textDisplay.innerHTML = '<p class="placeholder">Listening... Speak now</p>';
        recognition.start();
    }

    function stopRecording() {
        isRecording = false;
        recognition.stop();
        showNotification('Recording stopped', 'info');

        const avgConfidence = resultCount > 0 ? (confidenceSum / resultCount) : 0;
        const language = languageSelect.value;
        sendToServer(finalTranscript.trim(), language, avgConfidence);
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateTimer() {
        const now = new Date();
        const elapsed = new Date(now - recordingStartTime);
        const hours = String(elapsed.getUTCHours()).padStart(2, '0');
        const minutes = String(elapsed.getUTCMinutes()).padStart(2, '0');
        const seconds = String(elapsed.getUTCSeconds()).padStart(2, '0');
        timeStat.textContent = `${hours}:${minutes}:${seconds}`;
    }

    function updateWordsStat() {
        const text = finalTranscript || textDisplay.textContent;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordsStat.textContent = `${wordCount} words`;
    }

    function updateAccuracyStat() {
        if (resultCount > 0) {
            const avgConfidence = Math.round((confidenceSum / resultCount) * 100);
            accuracyStat.textContent = `${avgConfidence}% accuracy`;
        }
    }

    function animateVisualizer() {
        const animate = () => {
            if (!isRecording) return;

            bars.forEach(bar => {
                const height = Math.random() * 80 + 20;
                bar.style.height = `${height}px`;
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    function stopVisualizer() {
        bars.forEach(bar => {
            bar.style.height = '10px';
        });
    }

    function copyText() {
        const textToCopy = textDisplay.textContent;

        if (!textToCopy || textToCopy.includes('Your transcribed text will appear here') || textToCopy.includes('Listening... Speak now')) {
            showNotification('No text to copy', 'warning');
            return;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => showNotification('Text copied to clipboard', 'success'))
            .catch(() => showNotification('Failed to copy text', 'error'));
    }

    function clearText() {
        if (!textDisplay.textContent || textDisplay.textContent.includes('Your transcribed text will appear here')) {
            return;
        }

        if (confirm('Are you sure you want to clear the text?')) {
            finalTranscript = '';
            textDisplay.innerHTML = '<p class="placeholder">Your transcribed text will appear here...</p>';
            updateWordsStat();
            accuracyStat.textContent = '--% accuracy';
            showNotification('Text cleared', 'info');
        }
    }

    function downloadText() {
        const textToDownload = textDisplay.textContent;

        if (!textToDownload || textToDownload.includes('Your transcribed text will appear here') || textToDownload.includes('Listening... Speak now')) {
            showNotification('No text to download', 'warning');
            return;
        }

        const blob = new Blob([textToDownload], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcription_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Text downloaded', 'success');
    }

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = 'notification';

        switch (type) {
            case 'success':
                notification.style.background = 'var(--success-color)';
                break;
            case 'error':
                notification.style.background = 'var(--error-color)';
                break;
            case 'warning':
                notification.style.background = 'var(--warning-color)';
                break;
            default:
                notification.style.background = 'var(--primary-color)';
        }

        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function scrollToBottom() {
        textDisplay.scrollTop = textDisplay.scrollHeight;
    }

    function initParticles() {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: { value: "#6c63ff" },
                shape: {
                    type: "circle",
                    stroke: { width: 0, color: "#000000" },
                    polygon: { nb_sides: 5 }
                },
                opacity: { value: 0.3 },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#6c63ff",
                    opacity: 0.2,
                    width: 1
                },
                move: { enable: true, speed: 2 }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "grab" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 140,
                        line_linked: { opacity: 1 }
                    },
                    bubble: {
                        distance: 400,
                        size: 40,
                        duration: 2,
                        opacity: 8,
                        speed: 3
                    },
                    repulse: { distance: 200, duration: 0.4 },
                    push: { particles_nb: 4 },
                    remove: { particles_nb: 2 }
                }
            },
            retina_detect: true
        });
    }

    function checkThemePreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            themeSwitch.checked = savedTheme === 'dark';
        } else if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeSwitch.checked = true;
        }
    }

    function toggleTheme() {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }

    function sendToServer(text, language, confidence) {
        const timestamp = new Date().toISOString();

        fetch('http://localhost:3000/api/save-transcription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, language, confidence, timestamp })
        })
        .then(res => res.json())
        .then(data => console.log('Server response:', data))
        .catch(err => console.error('Error sending to server:', err));
    }
});