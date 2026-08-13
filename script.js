(function() {
    'use strict';

    const announcementOverlay = document.getElementById('announcementOverlay');
    const announcementBtn = document.getElementById('announcementBtn');
    const ventingMode = document.getElementById('ventingMode');
    const taoistMode = document.getElementById('taoistMode');
    const modeSwitchBtn = document.getElementById('modeSwitchBtn');
    const modeSwitchIcon = document.getElementById('modeSwitchIcon');
    const modeSwitchText = document.getElementById('modeSwitchText');

    const characterContainer = document.getElementById('characterContainer');
    const characterImage = document.getElementById('characterImage');
    const woundLayer = document.getElementById('woundLayer');
    const particleLayer = document.getElementById('particleLayer');
    const clickHint = document.getElementById('clickHint');
    const screenShake = document.getElementById('screenShake');
    const hitCountEl = document.getElementById('hitCount');
    const damageScoreEl = document.getElementById('damageScore');
    const installBtn = document.getElementById('installBtn');
    const weaponBtns = document.querySelectorAll('.weapon-btn');

    const bgMusicVenting = document.getElementById('bgMusicVenting');
    const bgMusicTaoist = document.getElementById('bgMusicTaoist');
    const portraitFrame = document.getElementById('portraitFrame');
    const portraitImage = document.getElementById('portraitImage');
    const portraitUpload = document.getElementById('portraitUpload');
    const paperMoneyLayer = document.getElementById('paperMoneyLayer');

    let currentWeapon = 'fist';
    let hitCount = 0;
    let damageScore = 0;
    let musicStarted = false;
    let isAttacking = false;
    let deferredPrompt = null;
    let currentMode = 'venting';
    let paperInterval = null;

    bgMusicVenting.volume = 0.6;
    bgMusicVenting.loop = true;
    bgMusicTaoist.volume = 0.6;
    bgMusicTaoist.loop = true;

    async function startMusic(mode) {
        const audio = mode === 'venting' ? bgMusicVenting : bgMusicTaoist;
        try {
            if (!audio.paused) return;
            await audio.play();
            musicStarted = true;
        } catch (err) {
            const resumeMusic = async () => {
                try {
                    await audio.play();
                    musicStarted = true;
                    document.removeEventListener('click', resumeMusic);
                    document.removeEventListener('touchstart', resumeMusic);
                } catch (e) {}
            };
            document.addEventListener('click', resumeMusic, { once: true });
            document.addEventListener('touchstart', resumeMusic, { once: true });
        }
    }

    function stopAllMusic() {
        bgMusicVenting.pause();
        bgMusicVenting.currentTime = 0;
        bgMusicTaoist.pause();
        bgMusicTaoist.currentTime = 0;
        musicStarted = false;
    }

    function switchMode(mode) {
        stopAllMusic();
        if (mode === 'venting') {
            ventingMode.style.display = 'flex';
            taoistMode.style.display = 'none';
            modeSwitchIcon.textContent = '🪦';
            modeSwitchText.textContent = '道场模式';
            currentMode = 'venting';
            clearPaperMoney();
            startMusic('venting');
        } else {
            ventingMode.style.display = 'none';
            taoistMode.style.display = 'flex';
            modeSwitchIcon.textContent = '🔪';
            modeSwitchText.textContent = '发泄模式';
            currentMode = 'taoist';
            startPaperMoney();
            startMusic('taoist');
        }
    }

    function startPaperMoney() {
        clearPaperMoney();
        paperInterval = setInterval(() => {
            const paper = document.createElement('div');
            paper.className = 'paper-piece';
            paper.textContent = '🪔';
            paper.style.left = Math.random() * 100 + '%';
            paper.style.animationDuration = (Math.random() * 5 + 4) + 's';
            paper.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
            paperMoneyLayer.appendChild(paper);
            setTimeout(() => paper.remove(), 10000);
        }, 800);
    }

    function clearPaperMoney() {
        if (paperInterval) {
            clearInterval(paperInterval);
            paperInterval = null;
        }
        paperMoneyLayer.innerHTML = '';
    }

    announcementBtn.addEventListener('click', async () => {
        announcementOverlay.style.display = 'none';
        announcementOverlay.style.pointerEvents = 'none';
        await startMusic('venting');
    });

    modeSwitchBtn.addEventListener('click', () => {
        const newMode = currentMode === 'venting' ? 'taoist' : 'venting';
        switchMode(newMode);
    });

    portraitFrame.addEventListener('click', () => {
        portraitUpload.click();
    });

    portraitUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                portraitImage.src = event.target.result;
                portraitFrame.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    });

    weaponBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            weaponBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentWeapon = this.dataset.weapon;
            if (currentMode === 'venting' && !musicStarted) {
                startMusic('venting');
            }
        });
    });

    characterContainer.addEventListener('click', async function(e) {
        if (isAttacking) return;
        if (announcementOverlay.style.display !== 'none' && announcementOverlay.style.display !== '') return;
        if (currentMode !== 'venting') return;
        if (!musicStarted) await startMusic('venting');
        isAttacking = true;
        const rect = characterContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        performAttack(percentX, percentY, x, y, rect);
        if (clickHint.style.display !== 'none') clickHint.style.display = 'none';
        setTimeout(() => { isAttacking = false; }, 250);
    });

    function performAttack(percentX, percentY, pixelX, pixelY, rect) {
        hitCount++;
        hitCountEl.textContent = hitCount;
        const damageValues = {
            fist: Math.floor(Math.random() * 15) + 5,
            knife: Math.floor(Math.random() * 30) + 20,
            gun: Math.floor(Math.random() * 60) + 40,
            chainsaw: Math.floor(Math.random() * 50) + 35,
            bat: Math.floor(Math.random() * 35) + 25,
            hammer: Math.floor(Math.random() * 45) + 30
        };
        const damage = damageValues[currentWeapon] || 10;
        damageScore += damage;
        damageScoreEl.textContent = damageScore;
        createWound(percentX, percentY, currentWeapon);
        createBloodParticles(pixelX, pixelY, rect, currentWeapon);
        triggerShake();
        triggerCharacterFlash();
        playHitFeedback();
    }

    function createWound(percentX, percentY, weapon) {
        const wound = document.createElement('div');
        wound.classList.add('wound-mark');
        let woundClass = '';
        switch (weapon) {
            case 'knife':
                woundClass = 'wound-knife';
                wound.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 60 - 30}deg)`;
                break;
            case 'gun':
                woundClass = 'wound-gun';
                break;
            case 'chainsaw':
                woundClass = 'wound-chainsaw';
                wound.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 40 - 20}deg)`;
                setTimeout(() => {
                    const offX = (Math.random() * 6 - 3);
                    const offY = (Math.random() * 6 - 3);
                    const w = document.createElement('div');
                    w.classList.add('wound-mark', 'wound-chainsaw');
                    w.style.left = (percentX + offX) + '%';
                    w.style.top = (percentY + offY) + '%';
                    w.style.transform = `translate(-50%, -50%) rotate(${Math.random()*50-25}deg)`;
                    w.style.width = '40px'; w.style.height = '12px';
                    woundLayer.appendChild(w);
                }, 40);
                break;
            case 'bat': woundClass = 'wound-bat'; break;
            case 'hammer': woundClass = 'wound-hammer'; break;
            default: woundClass = 'wound-fist';
        }
        wound.classList.add(woundClass);
        wound.style.left = (percentX + (Math.random()*1.5-0.75)) + '%';
        wound.style.top = (percentY + (Math.random()*1.5-0.75)) + '%';
        woundLayer.appendChild(wound);
        if (woundLayer.querySelectorAll('.wound-mark').length > 200) {
            woundLayer.querySelector('.wound-mark').remove();
        }
    }

    function createBloodParticles(pixelX, pixelY, rect, weapon) {
        const counts = { fist: 8, knife: 20, gun: 35, chainsaw: 40, bat: 15, hammer: 18 };
        const count = counts[weapon] || 10;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'blood-particle';
            const r = Math.random();
            if (r < 0.3) p.classList.add('large');
            else if (r < 0.7) p.classList.add('medium');
            else p.classList.add('small');
            const angle = Math.random() * Math.PI * 2;
            const dist = 25 + Math.random() * 80;
            p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
            p.style.left = pixelX + 'px';
            p.style.top = pixelY + 'px';
            particleLayer.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
    }

    function triggerShake() {
        screenShake.classList.remove('active');
        void screenShake.offsetWidth;
        screenShake.classList.add('active');
        setTimeout(() => screenShake.classList.remove('active'), 600);
    }

    function triggerCharacterFlash() {
        characterContainer.classList.add('attacking');
        characterImage.style.filter = 'brightness(1.3) saturate(1.5)';
        setTimeout(() => {
            characterContainer.classList.remove('attacking');
            characterImage.style.filter = '';
        }, 180);
    }

    function playHitFeedback() {
        const flash = document.createElement('div');
        flash.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,30,30,0.25);pointer-events:none;z-index:4;border-radius:8px;';
        characterContainer.appendChild(flash);
        setTimeout(() => flash.remove(), 400);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
        installBtn.textContent = '📱 安装到桌面';
    });

    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
        }
    });

    document.addEventListener('keydown', (e) => {
        const keys = { '1': 'fist', '2': 'knife', '3': 'gun', '4': 'chainsaw', '5': 'bat', '6': 'hammer' };
        if (keys[e.key] && currentMode === 'venting' && announcementOverlay.style.display === 'none') {
            weaponBtns.forEach(b => b.classList.remove('active'));
            const target = document.querySelector(`.weapon-btn[data-weapon="${keys[e.key]}"]`);
            if (target) target.classList.add('active');
            currentWeapon = keys[e.key];
        }
    });

    switchMode('venting');
})();