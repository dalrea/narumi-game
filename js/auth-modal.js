/**
 * auth-modal.js
 * 게임 종료 후 비로그인 상태일 때 로그인/회원가입 모달을 띄우고,
 * 로그인/가입 완료 시 pending 점수를 자동 저장하는 공통 유틸.
 *
 * 사용법:
 *   <script src="../js/auth-modal.js"></script>   (또는 상대경로 조정)
 *
 *   게임 종료 시:
 *     await showAuthModalAndSaveScore('game-id', score);
 *
 *   이미 로그인된 상태라면 곧바로 저장하고 반환.
 *   비로그인 상태라면 모달 → 로그인/가입 → 자동 저장.
 */

// ─── 스타일 (한 번만 주입) ────────────────────────────────────────────────
(function injectAuthModalStyles() {
    if (document.getElementById('_authModalStyle')) return;
    const style = document.createElement('style');
    style.id = '_authModalStyle';
    style.textContent = `
        #_authModalBackdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.65);
            z-index: 9000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: _amFadeIn 0.2s ease;
        }
        @keyframes _amFadeIn { from { opacity:0 } to { opacity:1 } }

        #_authModal {
            background: #1a1a2e;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 16px;
            padding: 32px 28px 24px;
            width: min(400px, 92vw);
            color: #fff;
            font-family: 'Pretendard', 'Segoe UI', sans-serif;
            position: relative;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        }

        #_authModal h2 {
            font-size: 20px;
            margin-bottom: 4px;
            font-weight: 700;
        }

        #_authModal .am-subtitle {
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            margin-bottom: 20px;
        }

        #_authModal .am-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }

        #_authModal .am-tab {
            flex: 1;
            padding: 8px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
            background: transparent;
            color: rgba(255,255,255,0.6);
            cursor: pointer;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
        }
        #_authModal .am-tab.active {
            background: #4ecdc4;
            border-color: #4ecdc4;
            color: #fff;
            font-weight: 600;
        }

        #_authModal .am-field {
            margin-bottom: 12px;
        }
        #_authModal .am-field input {
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.07);
            color: #fff;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        #_authModal .am-field input:focus {
            border-color: #4ecdc4;
        }
        #_authModal .am-field input::placeholder {
            color: rgba(255,255,255,0.3);
        }

        #_authModal .am-btn {
            width: 100%;
            padding: 11px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(135deg, #4ecdc4, #44b3ab);
            color: #fff;
            font-size: 15px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            margin-top: 4px;
            transition: opacity 0.2s;
        }
        #_authModal .am-btn:hover { opacity: 0.88; }
        #_authModal .am-btn:disabled { opacity: 0.5; cursor: default; }

        #_authModal .am-msg {
            font-size: 13px;
            margin-top: 10px;
            min-height: 18px;
            text-align: center;
        }
        #_authModal .am-msg.ok  { color: #4ecdc4; }
        #_authModal .am-msg.err { color: #ff6b6b; }

        #_authModal .am-skip {
            display: block;
            text-align: center;
            margin-top: 14px;
            font-size: 12px;
            color: rgba(255,255,255,0.35);
            cursor: pointer;
            background: none;
            border: none;
            font-family: inherit;
        }
        #_authModal .am-skip:hover { color: rgba(255,255,255,0.6); }

        #_authModal .am-close {
            position: absolute;
            top: 14px; right: 16px;
            background: none;
            border: none;
            color: rgba(255,255,255,0.4);
            font-size: 22px;
            cursor: pointer;
            line-height: 1;
            font-family: inherit;
        }
        #_authModal .am-close:hover { color: #fff; }
    `;
    document.head.appendChild(style);
})();

// ─── 모달 상태 ─────────────────────────────────────────────────────────────
let _amResolve = null;  // Promise resolver

// ─── 공개 API ──────────────────────────────────────────────────────────────
/**
 * 비로그인이면 모달을 열고 로그인/가입 후 점수를 저장.
 * 이미 로그인 상태면 바로 저장.
 *
 * @param {string} gameId  - saveScore 의 gameId
 * @param {number} score   - 저장할 점수
 * @param {string} [label] - 점수 라벨 (기본 '점')
 * @returns {Promise<boolean>} - 저장 성공 여부
 */
async function showAuthModalAndSaveScore(gameId, score, label = '점') {
    // 이미 로그인 상태면 곧바로 저장
    const user = await getCurrentUser().catch(() => null);
    if (user) {
        try {
            await saveScore(gameId, score);
            return true;
        } catch (e) {
            console.log('점수 저장 실패:', e);
            return false;
        }
    }

    // 비로그인 → 모달
    return new Promise(resolve => {
        _amResolve = resolve;
        _openAuthModal(gameId, score, label);
    });
}

// ─── 내부 함수 ─────────────────────────────────────────────────────────────
function _openAuthModal(gameId, score, label) {
    // 기존 모달 제거
    _closeAuthModal(false);

    const backdrop = document.createElement('div');
    backdrop.id = '_authModalBackdrop';
    backdrop.innerHTML = `
        <div id="_authModal" role="dialog" aria-modal="true">
            <button class="am-close" onclick="_closeAuthModal(false)" aria-label="닫기">×</button>
            <h2>🏆 점수를 저장하세요!</h2>
            <p class="am-subtitle">이번 게임 점수: <strong>${score.toLocaleString()}${label}</strong></p>

            <div class="am-tabs">
                <button class="am-tab active" id="_amTabLogin" onclick="_amSwitchTab('login')">로그인</button>
                <button class="am-tab" id="_amTabSignup" onclick="_amSwitchTab('signup')">회원가입</button>
            </div>

            <!-- 로그인 폼 -->
            <div id="_amFormLogin">
                <div class="am-field">
                    <input type="email" id="_amLoginEmail" placeholder="이메일" autocomplete="email">
                </div>
                <div class="am-field">
                    <input type="password" id="_amLoginPassword" placeholder="비밀번호" autocomplete="current-password">
                </div>
                <button class="am-btn" id="_amLoginBtn" onclick="_amDoLogin('${gameId}', ${score})">로그인 후 저장</button>
            </div>

            <!-- 회원가입 폼 -->
            <div id="_amFormSignup" style="display:none">
                <div class="am-field">
                    <input type="text" id="_amSignupNick" placeholder="닉네임" autocomplete="nickname">
                </div>
                <div class="am-field">
                    <input type="email" id="_amSignupEmail" placeholder="이메일" autocomplete="email">
                </div>
                <div class="am-field">
                    <input type="password" id="_amSignupPassword" placeholder="비밀번호 (6자 이상)" autocomplete="new-password">
                </div>
                <button class="am-btn" id="_amSignupBtn" onclick="_amDoSignup('${gameId}', ${score})">가입 후 저장</button>
            </div>

            <p class="am-msg" id="_amMsg"></p>
            <button class="am-skip" onclick="_closeAuthModal(false)">나중에 하기 (기록 저장 안 됨)</button>
        </div>
    `;

    document.body.appendChild(backdrop);

    // 배경 클릭으로 닫기
    backdrop.addEventListener('click', e => {
        if (e.target === backdrop) _closeAuthModal(false);
    });

    // 엔터 키 지원
    backdrop.addEventListener('keydown', e => {
        if (e.key === 'Escape') _closeAuthModal(false);
        if (e.key === 'Enter') {
            const activeTab = document.getElementById('_amTabLogin')?.classList.contains('active');
            if (activeTab) _amDoLogin(gameId, score);
            else _amDoSignup(gameId, score);
        }
    });

    // 첫 번째 입력 필드 포커스
    setTimeout(() => document.getElementById('_amLoginEmail')?.focus(), 100);
}

function _amSwitchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('_amTabLogin').classList.toggle('active', isLogin);
    document.getElementById('_amTabSignup').classList.toggle('active', !isLogin);
    document.getElementById('_amFormLogin').style.display = isLogin ? '' : 'none';
    document.getElementById('_amFormSignup').style.display = isLogin ? 'none' : '';
    document.getElementById('_amMsg').textContent = '';
    // 첫 번째 입력 필드 포커스
    setTimeout(() => {
        const el = isLogin ? document.getElementById('_amLoginEmail') : document.getElementById('_amSignupNick');
        el?.focus();
    }, 50);
}

function _amSetMsg(text, type) {
    const el = document.getElementById('_amMsg');
    if (!el) return;
    el.textContent = text;
    el.className = 'am-msg ' + (type || '');
}

function _amSetLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) btn.dataset.orig = btn.textContent;
    btn.textContent = loading ? '처리 중...' : (btn.dataset.orig || btn.textContent);
}

async function _amDoLogin(gameId, score) {
    const email = document.getElementById('_amLoginEmail')?.value?.trim();
    const password = document.getElementById('_amLoginPassword')?.value;

    if (!email || !password) {
        _amSetMsg('이메일과 비밀번호를 입력해 주세요.', 'err');
        return;
    }

    _amSetLoading('_amLoginBtn', true);
    _amSetMsg('');

    try {
        await signIn(email, password);
        _amSetMsg('로그인 성공! 점수 저장 중...', 'ok');
        await _amSaveAndClose(gameId, score);
    } catch (e) {
        _amSetLoading('_amLoginBtn', false);
        _amSetMsg('로그인 실패: ' + (e.message || '이메일/비밀번호를 확인해 주세요.'), 'err');
    }
}

async function _amDoSignup(gameId, score) {
    const nick = document.getElementById('_amSignupNick')?.value?.trim();
    const email = document.getElementById('_amSignupEmail')?.value?.trim();
    const password = document.getElementById('_amSignupPassword')?.value;

    if (!nick || !email || !password) {
        _amSetMsg('모든 항목을 입력해 주세요.', 'err');
        return;
    }
    if (password.length < 6) {
        _amSetMsg('비밀번호는 6자 이상이어야 합니다.', 'err');
        return;
    }

    _amSetLoading('_amSignupBtn', true);
    _amSetMsg('');

    try {
        await signUp(email, password, nick);
        _amSetMsg('가입 성공! 점수 저장 중...', 'ok');
        await _amSaveAndClose(gameId, score);
    } catch (e) {
        _amSetLoading('_amSignupBtn', false);
        _amSetMsg('가입 실패: ' + (e.message || '다시 시도해 주세요.'), 'err');
    }
}

async function _amSaveAndClose(gameId, score) {
    try {
        await saveScore(gameId, score);
        _amSetMsg('✓ 점수가 저장되었습니다!', 'ok');
        setTimeout(() => _closeAuthModal(true), 1200);
    } catch (e) {
        _amSetMsg('점수 저장 실패: ' + (e.message || ''), 'err');
        setTimeout(() => _closeAuthModal(false), 1500);
    }
}

function _closeAuthModal(success) {
    const backdrop = document.getElementById('_authModalBackdrop');
    if (backdrop) backdrop.remove();
    if (_amResolve) {
        _amResolve(success);
        _amResolve = null;
    }
}
