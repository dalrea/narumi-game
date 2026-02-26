#!/usr/bin/env node
/**
 * 스도쿠 퍼즐 생성기
 * 레벨 1~10, 각 10개, 총 100개
 * 시드 기반 결정적 생성 (같은 시드 → 같은 퍼즐)
 */

// ============================================================
// 기본 유틸
// ============================================================

/** 시드 기반 난수 (Mulberry32) */
function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
        s += 0x6D2B79F5;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ============================================================
// 스도쿠 솔버 & 생성기
// ============================================================

function gridCopy(g) { return g.map(r => r.slice()); }

function isValid(grid, row, col, num) {
    // 행
    if (grid[row].includes(num)) return false;
    // 열
    for (let r = 0; r < 9; r++) if (grid[r][col] === num) return false;
    // 3x3 박스
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
        for (let c = bc; c < bc + 3; c++)
            if (grid[r][c] === num) return false;
    return true;
}

/**
 * 해의 개수 카운트 (2 이상이면 조기 종료)
 * 반환: 0 = 해 없음, 1 = 유일해, 2 = 복수해
 */
function countSolutions(grid, limit = 2) {
    const empty = [];
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            if (grid[r][c] === 0) empty.push([r, c]);

    let count = 0;

    function solve(idx) {
        if (count >= limit) return;
        if (idx === empty.length) { count++; return; }
        const [r, c] = empty[idx];
        for (let n = 1; n <= 9; n++) {
            if (isValid(grid, r, c, n)) {
                grid[r][c] = n;
                solve(idx + 1);
                grid[r][c] = 0;
            }
        }
    }
    solve(0);
    return count;
}

/** 완성된 스도쿠 보드 하나 생성 (백트래킹 + 랜덤) */
function generateFullBoard(rng) {
    const grid = Array.from({ length: 9 }, () => new Array(9).fill(0));
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    function fill(pos) {
        if (pos === 81) return true;
        const r = Math.floor(pos / 9), c = pos % 9;
        const shuffled = shuffle(nums.slice(), rng);
        for (const n of shuffled) {
            if (isValid(grid, r, c, n)) {
                grid[r][c] = n;
                if (fill(pos + 1)) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    }
    fill(0);
    return grid;
}

/**
 * 퍼즐 생성: 완성 보드에서 clueTarget개 남기고 나머지 제거
 * 유일해 보장
 */
function generatePuzzle(fullGrid, clueTarget, rng) {
    const puzzle = gridCopy(fullGrid);
    // 셀 순서를 무작위로 섞어서 제거 시도
    const positions = [];
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            positions.push([r, c]);
    shuffle(positions, rng);

    let clues = 81;
    for (const [r, c] of positions) {
        if (clues <= clueTarget) break;
        const backup = puzzle[r][c];
        puzzle[r][c] = 0;
        // 유일해 확인
        const testGrid = gridCopy(puzzle);
        if (countSolutions(testGrid, 2) !== 1) {
            puzzle[r][c] = backup; // 복원
        } else {
            clues--;
        }
    }
    return { puzzle, clues };
}

/** 그리드를 81자리 문자열로 변환 */
function gridToStr(grid) {
    return grid.flat().join('');
}

// ============================================================
// 레벨별 단서(clue) 범위 정의
// 프레임워크 기준:
//  Lv1: 40-50 (Naked Single only)
//  Lv2: 36-45 (+ Hidden Single)
//  Lv3: 32-40 (+ Naked Pair)
//  Lv4: 30-36 (+ Box-Line Reduction)
//  Lv5: 28-34 (+ Naked/Hidden Triple)
//  Lv6: 26-32 (+ X-Wing)
//  Lv7: 24-30 (+ XY-Wing)
//  Lv8: 22-28 (+ XYZ-Wing / Coloring)
//  Lv9: 20-26 (+ Forcing Chain)
//  Lv10:17-24 (+ ALS / multi-chain)
// 각 레벨에서 범위의 중간값을 목표로 사용
// ============================================================
const LEVEL_TARGETS = {
    1:  { min: 40, max: 50, target: 45 },
    2:  { min: 36, max: 45, target: 40 },
    3:  { min: 32, max: 40, target: 36 },
    4:  { min: 30, max: 36, target: 33 },
    5:  { min: 28, max: 34, target: 31 },
    6:  { min: 26, max: 32, target: 29 },
    7:  { min: 24, max: 30, target: 27 },
    8:  { min: 22, max: 28, target: 25 },
    9:  { min: 20, max: 26, target: 23 },
    10: { min: 17, max: 24, target: 21 },
};

// ============================================================
// 메인 생성 루프
// ============================================================
const results = {};
let totalGenerated = 0;

for (let level = 1; level <= 10; level++) {
    results[level] = [];
    const { target, min, max } = LEVEL_TARGETS[level];

    for (let idx = 0; idx < 10; idx++) {
        // 시드: level * 10000 + idx * 100 + retry
        let puzzle = null;
        let solution = null;

        for (let retry = 0; retry < 50; retry++) {
            const seed = level * 10000 + idx * 100 + retry;
            const rng = makeRng(seed);
            const full = generateFullBoard(rng);
            const rng2 = makeRng(seed + 1);
            const { puzzle: p, clues } = generatePuzzle(full, target, rng2);

            if (clues >= min && clues <= max) {
                puzzle = p;
                solution = full;
                break;
            }
        }

        if (!puzzle) {
            // 범위 완화해서 재시도
            for (let retry = 0; retry < 30; retry++) {
                const seed = level * 10000 + idx * 100 + 50 + retry;
                const rng = makeRng(seed);
                const full = generateFullBoard(rng);
                const rng2 = makeRng(seed + 1);
                const { puzzle: p, clues } = generatePuzzle(full, target, rng2);
                // 범위 ±3 완화
                if (clues >= min - 3 && clues <= max + 3) {
                    puzzle = p;
                    solution = full;
                    break;
                }
            }
        }

        if (!puzzle) {
            console.error(`  [ERROR] Level ${level} Stage ${idx + 1} 생성 실패!`);
            process.exit(1);
        }

        const puzzleStr = gridToStr(puzzle);
        const solutionStr = gridToStr(solution);
        const clueCount = puzzleStr.split('').filter(c => c !== '0').length;

        results[level].push({ puzzle: puzzleStr, solution: solutionStr });
        process.stdout.write(`  Level ${level} Stage ${idx + 1}: ${clueCount}개 단서\n`);
        totalGenerated++;
    }
}

// ============================================================
// puzzles.js 출력
// ============================================================
let output = `// 스도쿠 퍼즐 데이터 - 레벨 1~10, 각 레벨 10개, 총 100개
// 자동 생성됨 (gen_puzzles.js)
// 난이도 프레임워크:
//  Lv1(입문):     단서 40~50개 - Naked Single only
//  Lv2(초급):     단서 36~45개 - + Hidden Single
//  Lv3(쉬움):     단서 32~40개 - + Naked Pair
//  Lv4(보통):     단서 30~36개 - + Box-Line Reduction
//  Lv5(중간):     단서 28~34개 - + Naked/Hidden Triple
//  Lv6(어려움):   단서 26~32개 - + X-Wing
//  Lv7(고급):     단서 24~30개 - + XY-Wing
//  Lv8(매우어려움): 단서 22~28개 - + XYZ-Wing/Coloring
//  Lv9(극강):     단서 20~26개 - + Forcing Chain
//  Lv10(전설):    단서 17~24개 - + ALS/Multi-Chain

const SUDOKU_PUZZLES = {\n`;

for (let level = 1; level <= 10; level++) {
    const names = ['입문','초급','쉬움','보통','중간','어려움','고급','매우어려움','극강','전설'];
    output += `    // ===== LEVEL ${level} (${names[level-1]}) =====\n`;
    output += `    ${level}: [\n`;
    for (const p of results[level]) {
        output += `        {\n`;
        output += `            puzzle:   "${p.puzzle}",\n`;
        output += `            solution: "${p.solution}"\n`;
        output += `        },\n`;
    }
    output += `    ],\n`;
}

output += `};

// 퍼즐 가져오기
function getPuzzle(level, index) {
    const puzzles = SUDOKU_PUZZLES[level];
    if (!puzzles || index < 0 || index >= puzzles.length) return null;
    return puzzles[index];
}

// 문자열을 2D 배열로 변환
function puzzleStringToGrid(str) {
    const grid = [];
    for (let r = 0; r < 9; r++) {
        grid[r] = [];
        for (let c = 0; c < 9; c++) {
            grid[r][c] = parseInt(str[r * 9 + c]);
        }
    }
    return grid;
}
`;

const fs = require('fs');
const outPath = __dirname + '/puzzles.js';
fs.writeFileSync(outPath, output, 'utf8');
console.log(`\n총 ${totalGenerated}개 퍼즐 생성 완료 → ${outPath}`);
