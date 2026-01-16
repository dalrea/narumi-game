// Supabase 클라이언트 설정
const SUPABASE_URL = 'https://gaddpehqcxvvylfehlxh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGRwZWhxY3h2dnlsZmVobHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDE0MTgsImV4cCI6MjA4MTM3NzQxOH0.3tJUdK17TVUgY96SsA_PmGtiHm5wSyy1xtGdjNwqUbI';

// 가짜 이메일 도메인 (아이디를 이메일로 변환)
const FAKE_EMAIL_DOMAIN = '@simsim.local';

// Supabase 클라이언트 초기화
let supabase = null;

async function initSupabase() {
    if (supabase) return supabase;

    // Supabase JS 라이브러리 동적 로드
    if (!window.supabase) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2.39.3/dist/umd/supabase.js';
            script.onload = () => {
                console.log('Supabase library loaded', window.supabase);
                resolve();
            };
            script.onerror = (e) => {
                console.error('Failed to load Supabase library', e);
                reject(e);
            };
            document.head.appendChild(script);
        });

        // 라이브러리 로드 후 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // window.supabase 확인
    if (!window.supabase || !window.supabase.createClient) {
        console.error('window.supabase:', window.supabase);
        throw new Error('Supabase 라이브러리를 로드할 수 없습니다.');
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client created');
    return supabase;
}

// 아이디를 가짜 이메일로 변환
function usernameToEmail(username) {
    return username.toLowerCase() + FAKE_EMAIL_DOMAIN;
}

// 현재 사용자 가져오기
async function getCurrentUser() {
    const client = await initSupabase();
    const { data: { user } } = await client.auth.getUser();
    return user;
}

// 회원가입 (아이디/비밀번호)
async function signUp(username, password, nickname) {
    const client = await initSupabase();
    const email = usernameToEmail(username);

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
                nickname: nickname || username
            },
            // 이메일 확인 비활성화
            emailRedirectTo: undefined
        }
    });

    if (error) throw error;

    // 회원가입 후 자동 로그인
    if (data.user && !data.session) {
        // 이메일 확인이 필요한 경우 바로 로그인 시도
        return await signIn(username, password);
    }

    return data;
}

// 로그인 (아이디/비밀번호)
async function signIn(username, password) {
    const client = await initSupabase();
    const email = usernameToEmail(username);

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

// 로그아웃
async function signOut() {
    const client = await initSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
}

// 점수 저장
async function saveScore(gameId, score) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) {
        console.log('로그인이 필요합니다.');
        return null;
    }

    const nickname = user.user_metadata?.nickname || user.user_metadata?.username || 'Player';

    const { data, error } = await client
        .from('scores')
        .insert({
            user_id: user.id,
            game_id: gameId,
            score: score,
            nickname: nickname
        });

    if (error) throw error;
    return data;
}

// 최고 점수 가져오기 (개인)
async function getMyHighScore(gameId) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await client
        .from('scores')
        .select('score')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.score || 0;
}

// 랭킹 가져오기 (상위 10명)
async function getLeaderboard(gameId, limit = 10) {
    const client = await initSupabase();

    const { data, error } = await client
        .from('scores')
        .select('nickname, score, created_at')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// 인증 상태 변경 리스너
async function onAuthStateChange(callback) {
    const client = await initSupabase();
    client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// 현재 사용자 닉네임 가져오기
async function getCurrentNickname() {
    const user = await getCurrentUser();
    if (!user) return null;
    return user.user_metadata?.nickname || user.user_metadata?.username || 'Player';
}
