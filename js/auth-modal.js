/**
 * auth-modal.js
 * 게임 종료 후 비로그인 상태일 때 로그인/회원가입 모달을 띄우고,
 * 로그인/가입 완료 시 pending 점수를 자동 저장하는 공통 유틸.
 *
 * 사용법:
 *   <script src="../js/auth-modal.js"></script>
 *
 *   게임 종료 시:
 *     showAuthModalAndSaveScore('game-id', score);
 *     showAuthModalAndSaveScore('game-id', score, '스테이지');  // 라벨 지정
 *
 *   이미 로그인된 상태라면 곧바로 저장하고 반환.
 *   비로그인 상태라면 모달 → 로그인/가입 → 자동 저장.
 */

// ─── 스타일 주입 (한 번만) ───────────────────────────────────────────────
(function () {
    if (document.getElementById('_authModalStyle')) return;
    const style = document.createElement('style');
    style.id = '_authModalStyle';
    style.textContent = `
        #_amBackdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: _amIn 0.2s ease;
        }
        @keyframes _amIn { from { opacity:0 } to { opacity:1 } }

        #_amBox {
            background: #16213e;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 16px;
            padding: 28px 24px 20px;
            width: min(380px, 90vw);
            color: #fff;
            font-family: 'Pretendard', 'Segoe UI', sans-serif;
            position: relative;
            box-shadow: 0 12px 48px rgba(0,0,0,0.7);
        }
        #_amBox h2 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 4px;
        }
        #_amBox .am-sub {
            font-size: 13px;
            color: rgba(255,255,255,0.5);
            margin: 0 0 18px;
        }
        #_amBox .am-sub strong { color: #4ecdc4; }
        #_amBox .am-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }
        #_amBox .am-tab {
            flex: 1;
            padding: 8px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.2);
            background: transparent;
            color: rgba(255,255,255,0.55);
            cursor: pointer;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
        }
        #_amBox .am-tab.on {
            background: #4ecdc4;
            border-color: #4ecdc4;
            color: #fff;
            font-weight: 600;
        }
        #_amBox .am-row { margin-bottom: 10px; }
        #_amBox .am-row input {
            width: 100%;
            padding: 9px 11px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.06);
            color: #fff;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        #_amBox .am-row input:focus { border-color: #4ecdc4; }
        #_amBox .am-row input::placeholder { color: rgba(255,255,255,0.28); }
        #_amBox .am-submit {
            width: 100%;
            padding: 10px;
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
        #_amBox .am-submit:hover { opacity: 0.85; }
        #_amBox .am-submit:disabled { opacity: 0.45; cursor: default; }
        #_amBox .am-msg {
            font-size: 13px;
            margin-top: 10px;
            min-height: 18px;
            text-align: center;
        }
        #_amBox .am-msg.ok  { color: #4ecdc4; }
        #_amBox .am-msg.err { color: #ff6b6b; }
        #_amBox .am-skip {
            display: block;
            width: 100%;
            text-align: center;
            margin-top: 12px;
            font-size: 12px;
            color: rgba(255,255,255,0.3);
            cursor: pointer;
            background: none;
            border: none;
            font-family: inherit;
            padding: 0;
        }
        #_amBox .am-skip:hover { color: rgba(255,255,255,0.55); }
        #_amBox .am-x {
            position: absolute;
            top: 12px; right: 14px;
            background: none;
            border: none;
            color: rgba(255,255,255,0.35);
            font-size: 22px;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            font-family: inherit;
        }
        #_amBox .am-x:hover { color: #fff; }
    `;
    document.head.appendChild(style);
})();

// ─── 상태 ────────────────────────────────────────────────────────────────
let _amCtx = null;  // { gameId, score, resolve }

// ─── 공개 API ─────────────────────────────────────────────────────────────
/**
 * 비로그인이면 모달을 열고 로그인/가입 후 점수 저장.
 * 이미 로그인 상태면 바로 저장.
 *
 * @param {string} gameId
 * @param {number} score
 * @param {string} [label]  점수 단위 (기본 '점')
 * @returns {Promise<boolean>}
 */
async function showAuthModalAndSaveScore(gameId, score, label) {
    label = label || '점';

    // 로그인 여부 재확인 (게임 시작 이후 상태가 달라질 수 있음)
    let user = null;
    try { user = await getCurrentUser(); } catch (_) {}

    if (user) {
        try { await saveScore(gameId, score); return true; }
        catch (e) { console.log('점수 저장 실패:', e); return false; }
    }

    // 비로그인 → 모달
    return new Promise(function (resolve) {
        _amCtx = { gameId: gameId, score: score, resolve: resolve };
        _amOpen(score, label);
    });
}

// ─── 내부 ─────────────────────────────────────────────────────────────────
function _amOpen(score, label) {
    _amDestroy();   // 혹시 이전 모달 있으면 제거

    // 백드롭 생성
    var backdrop = document.createElement('div');
    backdrop.id = '_amBackdrop';

    // 모달 박스 생성
    var box = document.createElement('div');
    box.id = '_amBox';
    box.innerHTML =
        '<button class="am-x" id="_amX">\u00d7</button>' +
        '<h2>\uD83C\uDFC6 \uc810\uc218\ub97c \uc800\uc7a5\ud558\uc138\uc694!</h2>' +
        '<p class="am-sub">\uc774\ubc88 \uac8c\uc784 \uc810\uc218: <strong>' + score.toLocaleString() + label + '</strong></p>' +
        '<div class="am-tabs">' +
          '<button class="am-tab on" id="_amT0">\ub85c\uadf8\uc778</button>' +
          '<button class="am-tab" id="_amT1">\ud68c\uc6d0\uac00\uc785</button>' +
        '</div>' +
        '<div id="_amF0">' +
          '<div class="am-row"><input type="email" id="_amE0" placeholder="\uc774\uba54\uc77c" autocomplete="email"></div>' +
          '<div class="am-row"><input type="password" id="_amP0" placeholder="\ube44\ubc00\ubc88\ud638" autocomplete="current-password"></div>' +
          '<button class="am-submit" id="_amBtn0">\ub85c\uadf8\uc778 \ud6c4 \uc800\uc7a5</button>' +
        '</div>' +
        '<div id="_amF1" style="display:none">' +
          '<div class="am-row"><input type="text" id="_amNick" placeholder="\ub2c9\ub124\uc784" autocomplete="nickname"></div>' +
          '<div class="am-row"><input type="email" id="_amE1" placeholder="\uc774\uba54\uc77c" autocomplete="email"></div>' +
          '<div class="am-row"><input type="password" id="_amP1" placeholder="\ube44\ubc00\ubc88\ud638 (6\uc790 \uc774\uc0c1)" autocomplete="new-password"></div>' +
          '<button class="am-submit" id="_amBtn1">\uac00\uc785 \ud6c4 \uc800\uc7a5</button>' +
        '</div>' +
        '<p class="am-msg" id="_amMsg"></p>' +
        '<button class="am-skip" id="_amSkip">\ub098\uc911\uc5d0 \ud558\uae30 (\uae30\ub85d \uc800\uc7a5 \uc548 \ub428)</button>';

    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    // 이벤트 연결
    document.getElementById('_amX').addEventListener('click', function () { _amClose(false); });
    document.getElementById('_amSkip').addEventListener('click', function () { _amClose(false); });
    document.getElementById('_amT0').addEventListener('click', function () { _amTab(0); });
    document.getElementById('_amT1').addEventListener('click', function () { _amTab(1); });
    document.getElementById('_amBtn0').addEventListener('click', _amLogin);
    document.getElementById('_amBtn1').addEventListener('click', _amSignup);

    // 배경 클릭
    backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) _amClose(false);
    });

    // ESC / Enter
    backdrop.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { _amClose(false); return; }
        if (e.key === 'Enter') {
            var isLogin = document.getElementById('_amT0').classList.contains('on');
            if (isLogin) _amLogin(); else _amSignup();
        }
    });

    setTimeout(function () {
        var el = document.getElementById('_amE0');
        if (el) el.focus();
    }, 80);
}

function _amTab(idx) {
    document.getElementById('_amT0').classList.toggle('on', idx === 0);
    document.getElementById('_amT1').classList.toggle('on', idx === 1);
    document.getElementById('_amF0').style.display = idx === 0 ? '' : 'none';
    document.getElementById('_amF1').style.display = idx === 1 ? '' : 'none';
    document.getElementById('_amMsg').textContent = '';
    var focusId = idx === 0 ? '_amE0' : '_amNick';
    setTimeout(function () {
        var el = document.getElementById(focusId);
        if (el) el.focus();
    }, 40);
}

function _amMsg(text, type) {
    var el = document.getElementById('_amMsg');
    if (!el) return;
    el.textContent = text;
    el.className = 'am-msg' + (type ? ' ' + type : '');
}

function _amBusy(btnId, on) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = on;
    if (on) { btn.dataset.orig = btn.textContent; btn.textContent = '처리 중...'; }
    else { btn.textContent = btn.dataset.orig || btn.textContent; }
}

async function _amLogin() {
    var email = (document.getElementById('_amE0').value || '').trim();
    var pw    = document.getElementById('_amP0').value || '';
    if (!email || !pw) { _amMsg('이메일과 비밀번호를 입력해 주세요.', 'err'); return; }

    _amBusy('_amBtn0', true);
    _amMsg('');
    try {
        await signIn(email, pw);
        _amMsg('로그인 성공! 점수 저장 중...', 'ok');
        await _amSave();
    } catch (e) {
        _amBusy('_amBtn0', false);
        _amMsg('로그인 실패: ' + (e.message || '이메일/비밀번호를 확인해 주세요.'), 'err');
    }
}

async function _amSignup() {
    var nick  = (document.getElementById('_amNick').value || '').trim();
    var email = (document.getElementById('_amE1').value || '').trim();
    var pw    = document.getElementById('_amP1').value || '';
    if (!nick || !email || !pw) { _amMsg('모든 항목을 입력해 주세요.', 'err'); return; }
    if (pw.length < 6) { _amMsg('비밀번호는 6자 이상이어야 합니다.', 'err'); return; }

    _amBusy('_amBtn1', true);
    _amMsg('');
    try {
        await signUp(email, pw, nick);
        _amMsg('가입 성공! 점수 저장 중...', 'ok');
        await _amSave();
    } catch (e) {
        _amBusy('_amBtn1', false);
        _amMsg('가입 실패: ' + (e.message || '다시 시도해 주세요.'), 'err');
    }
}

async function _amSave() {
    if (!_amCtx) return;
    try {
        await saveScore(_amCtx.gameId, _amCtx.score);
        _amMsg('✓ 점수가 저장되었습니다!', 'ok');
        setTimeout(function () { _amClose(true); }, 1100);
    } catch (e) {
        _amMsg('점수 저장 실패: ' + (e.message || ''), 'err');
        setTimeout(function () { _amClose(false); }, 1500);
    }
}

function _amDestroy() {
    var el = document.getElementById('_amBackdrop');
    if (el) el.remove();
}

function _amClose(ok) {
    _amDestroy();
    if (_amCtx) {
        _amCtx.resolve(ok);
        _amCtx = null;
    }
}
