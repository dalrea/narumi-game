// Supabase 클라이언트 설정
const SUPABASE_URL = 'https://gaddpehqcxvvylfehlxh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZGRwZWhxY3h2dnlsZmVobHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDE0MTgsImV4cCI6MjA4MTM3NzQxOH0.3tJUdK17TVUgY96SsA_PmGtiHm5wSyy1xtGdjNwqUbI';

// Supabase 클라이언트 초기화
let supabaseClient = null;

async function initSupabase() {
    if (supabaseClient) return supabaseClient;

    // window.supabase 확인 (HTML에서 CDN으로 로드됨)
    if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Supabase 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
}

// 현재 사용자 가져오기
async function getCurrentUser() {
    const client = await initSupabase();
    const { data: { user } } = await client.auth.getUser();
    return user;
}

// 회원가입 (이메일/비밀번호)
async function signUp(email, password, nickname) {
    const client = await initSupabase();

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                nickname: nickname || email.split('@')[0]
            }
        }
    });

    if (error) throw error;
    return data;
}

// 로그인 (이메일/비밀번호)
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

// 랭킹 가져오기 (사용자당 최고 점수만, 상위 N명)
async function getLeaderboard(gameId, limit = 10) {
    const client = await initSupabase();

    // 더 많은 데이터를 가져온 후 사용자별 최고 점수만 필터링
    const { data, error } = await client
        .from('scores')
        .select('user_id, nickname, score, created_at')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(limit * 20); // 충분한 데이터 확보

    if (error) throw error;
    if (!data) return [];

    // 사용자별 최고 점수만 추출 (user_id가 없으면 nickname 사용)
    const userBestScores = new Map();
    for (const record of data) {
        // user_id가 있으면 user_id 사용, 없으면 nickname을 키로 사용
        const key = record.user_id || `nickname_${record.nickname}`;
        if (!userBestScores.has(key) || userBestScores.get(key).score < record.score) {
            userBestScores.set(key, {
                nickname: record.nickname,
                score: record.score,
                created_at: record.created_at
            });
        }
    }

    // Map을 배열로 변환하고 점수순 정렬 후 limit 적용
    return Array.from(userBestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
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

// 게임 컬렉션 저장 (upsert)
async function saveGameCollection(gameId, collectionData, currentStage) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) {
        console.log('로그인이 필요합니다.');
        return null;
    }

    const { data, error } = await client
        .from('game_collections')
        .upsert({
            user_id: user.id,
            game_id: gameId,
            collection_data: collectionData,
            current_stage: currentStage,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,game_id'
        });

    if (error) throw error;
    return data;
}

// 게임 컬렉션 불러오기
async function loadGameCollection(gameId) {
    const client = await initSupabase();
    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await client
        .from('game_collections')
        .select('collection_data, current_stage')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}
