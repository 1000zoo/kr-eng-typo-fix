import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';


export default class KrEngTypoFixer extends Plugin {

	onload() {
		this.addCommand({
			id: "fix-to-korean",
			name: "Fix to Korean",
			editorCallback: (editor: Editor) => {
				const selected = editor.getSelection()
				if (!selected) return; // 드레그 된 부분이 없다면 끝
				const fixed = fixTypo(selected);
				editor.replaceSelection(fixed)

				console.log(selected)
				console.log(fixed)
			}
		})
	}
}



const start = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const middle = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const end = [null, "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];


const engKrMap: { [key: string]: string} = {
    "a" : "ㅁ", "b" : "ㅠ", "c" : "ㅊ", "d" : "ㅇ", "e" : "ㄷ", "f" : "ㄹ", "g" : "ㅎ", "h" : "ㅗ", "i" : "ㅑ", "j" : "ㅓ",
    "k" : "ㅏ", "l" : "ㅣ", "m" : "ㅡ", "n" : "ㅜ", "o" : "ㅐ", "p" : "ㅔ", "q" : "ㅂ", "r" : "ㄱ", "s" : "ㄴ", "t" : "ㅅ",
    "u" : "ㅕ", "v" : "ㅍ", "w" : "ㅈ", "x" : "ㅌ", "y" : "ㅛ", "z" : "ㅋ", "E" : "ㄸ", "Q" : "ㅃ", "R" : "ㄲ", "T" : "ㅆ",
    "W" : "ㅉ", "O" : "ㅒ", "P" : "ㅖ"
}

function fixTypo(inputString: string): string {
    const hangulList = toHangulList(inputString);
    const split = splitHangul(hangulList);
    const concat = split.map((w) => concateHangul(w));

    return concat.join("");
}

function toHangulList(engs: string): string {
	let temp: string[] = [];

	for (let alp of engs) {
		temp.push(engKrMap[alp] || alp);
	}

	return temp.join("");
}

function splitHangul(hanguls: string): string[][] {
    let splitList: string[][] = [];
    let temp: string[] = [];

    for (let i = 0; i < hanguls.length; i++) {
        const hangul = hanguls[i];

        // 한글이 아닌 경우
        if (!isHangul(hangul)) {
            if (temp.length !== 0) {
                splitList.push([...temp]);
                temp = [];
            }
            splitList.push([hangul]);
            continue;
        }

        // 마지막 문자인 경우
        if (i === hanguls.length - 1) {
            temp.push(hangul);
            splitList.push([...temp]);
            continue;
        }

        // 현재까지 임시 배열에 저장된 한글 자모가 2개 이하인 경우
        if (temp.length <= 1) {
            temp.push(hangul);
            continue;
        }

        // 현재 글자와 다음 글자가 모두 중성이 아닌 경우 (종성이 있는 경우)
        if (!isMiddle(hangul) && !isMiddle(hanguls[i + 1])) {
            temp.push(hangul);
            splitList.push([...temp]);
            temp = [];
        } else if (!isMiddle(hangul)) {
            // 현재 글자가 중성이 아니면 현재까지의 배열을 결과에 추가하고, 현재 글자로 새 배열을 시작
            splitList.push([...temp]);
            temp = [hangul];
        } else {
            // 그 외의 경우 현재 글자를 임시 배열에 추가
            temp.push(hangul);
        }
    }

    return splitList;
}

function concateHangul(hangul: string[]): string {
    if (!onlyHangul(hangul)) {
        return hangul.join("");
    }

    // 종성이 없는 경우
    if (hangul.length === 2) {
        return String.fromCharCode((start.indexOf(hangul[0]) * 588) + (middle.indexOf(hangul[1]) * 28) + 44032);
    }

    // 종성이 있는 경우
    if (hangul.length === 3) {
        return concateHangulBadchim(hangul);
    }

    return "";
}

function concateHangulBadchim(hangul: string[]): string {
    return String.fromCharCode(
        (start.indexOf(hangul[0]) * 588) +
        (middle.indexOf(hangul[1]) * 28) +
        (end.indexOf(hangul[2]) || 0) + 44032
    );
}

function onlyHangul(hangul: string[]): boolean {
    return hangul.every(h => isHangul(h));
}

function isHangul(c: string): boolean {
    // 초성, 중성, 종성 리스트에 문자 c가 포함되어 있는지 확인합니다.
    return start.includes(c) || middle.includes(c) || end.includes(c);
}

function isMiddle(hangul: string): boolean {
    // 중성 리스트에 문자 hangul이 포함되어 있는지 확인합니다.
    return middle.includes(hangul);
}

