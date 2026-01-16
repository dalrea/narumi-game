// Supabase 클라이언트 설정
const SUPABASE_URL = 'https://gaddpehqcxvvylfehlxh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Vg3261Vtw0WFts0BEGx7fw_vyfvI6un';

// Supabase 클라이언트 초기화
let supabase = null;

async function initSupabase() {
    if (supabase) return supabase;

    // Supabase JS 라이브러리 동적 로드
    if (!window.supabase) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
}

// 현재 사용자 가져오기
async function getCurrentUser() {
    const client = await initSupabase();
    const { data: { user } } = await client.auth.getUser();
    return user;
}

// 회원가입
async function signUp(email, password, nickname) {
    const client = await initSupabase();
    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                nickname: nickname
            }
        }
    });

    if (error) throw error;
    return data;
}

// 로그인
async function signIn(email, password) {
    const client = await initSupabase();
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

// 구글 로그인
async function signInWithGoogle() {
    const client = await initSupabase();
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) throw error;
    return data;
}

// 점수 저장
async function saveScore(gameId, score) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) {
        console.log('로그인이 필요합니다.');
        return null;
    }

    const { data, error } = await client
        .from('scores')
        .insert({
            user_id: user.id,
            game_id: gameId,
            score: score,
            nickname: user.user_metadata?.nickname || user.email.split('@')[0]
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
