import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';


export default class KrEngTypoFixer extends Plugin {

	onload() {
		this.addCommand({
			id: "fix-to-korean",
			name: "Fix to Korean",
			editorCallback: (editor: Editor) => fixKrEngTypo(editor)
		})

	}
}

function fixKrEngTypo(editor: Editor) {
	try {
		const selected = editor.getSelection()
		if (!selected) return; // 드레그 된 부분이 없다면 끝
		const fixed = typoFix(selected);
		editor.replaceSelection(fixed)
		new Notice("변경되었습니다.")
	} catch (error) {
		new Notice("죄송해요. 에러가 발생했어요!")
	}
}

const start = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const middle = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const end = [null, "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const engKrMap: { [key: string]: string } = {
    "a": "ㅁ", "b": "ㅠ", "c": "ㅊ", "d": "ㅇ", "e": "ㄷ", "f": "ㄹ", "g": "ㅎ", "h": "ㅗ", "i": "ㅑ", "j": "ㅓ",
    "k": "ㅏ", "l": "ㅣ", "m": "ㅡ", "n": "ㅜ", "o": "ㅐ", "p": "ㅔ", "q": "ㅂ", "r": "ㄱ", "s": "ㄴ", "t": "ㅅ",
    "u": "ㅕ", "v": "ㅍ", "w": "ㅈ", "x": "ㅌ", "y": "ㅛ", "z": "ㅋ", "E": "ㄸ", "Q": "ㅃ", "R": "ㄲ", "T": "ㅆ",
    "W": "ㅉ", "O": "ㅒ", "P": "ㅖ"
};

const specialMap: { [key: string]: string } = {
    "rt": "ㄳ", "sw": "ㄵ", "sg": "ㄶ", "fr": "ㄺ", "fa": "ㄻ", "fq": "ㄼ",
    "ft": "ㄽ", "fx": "ㄾ", "fv": "ㄿ", "fg": "ㅀ", "qt": "ㅄ",
    "hk": "ㅘ", "ho": "ㅙ", "hl": "ㅚ", "nj": "ㅝ", "np": "ㅞ", "nl": "ㅟ", "ml": "ㅢ"
};

function isConsonantForStartInHangul(alp: string): boolean {
    return engKrMap[alp] in start;
}

function isVowelInHangul(alp: string): boolean {
    if (alp in engKrMap) {
        return middle.includes(engKrMap[alp]);
    }
    if (alp in specialMap) {
        return middle.includes(specialMap[alp]);
    }
    return false;
}

function alpToHangul(alps: string[]): string[] {
    return alps.map(alp => engKrMap[alp] || specialMap[alp] || '');
}

function isSpecial(alp1: string, alp2: string): boolean {
    return (alp1 + alp2) in specialMap;
}

function printList(list: string[][]) {
    for (var l in list) {
        console.log(l)
    }
}

function toHangulSplitList(alps: string[]): string[][] {
    const splitList: string[][] = [];
    let temp: string[] = [];

    alps.forEach((alp, i) => {
        if (!(alp in engKrMap)) { // 공백, 특수, 숫자 등
            if (temp.length) {
                splitList.push(alpToHangul(temp));
                temp = [];
            }
            splitList.push([alp]);
            return;
        }

        if (!temp.length) { // 현재 버퍼가 비어있을 때
            if (isVowelInHangul(alp)) {
                splitList.push([alp]);
            } else {
                temp.push(alp);
            }
            return;
        }

        const lastAlp = temp[temp.length - 1];

        if (isVowelInHangul(alp)) { // 현재 알파벳이 모음일 때
            if (temp.length === 1) {
                if (isVowelInHangul(lastAlp)) {
                    // 여기에 도달하면 안 됨
                } else {
                    temp.push(alp);
                }
            } else {
                if (isVowelInHangul(lastAlp)) { // 마지막이 모음일 때
                    if (isSpecial(lastAlp, alp)) {
                        temp[temp.length - 1] = lastAlp + alp;
                    } else {
                        splitList.push(alpToHangul(temp));
                        temp = [alp];
                    }
                } else { // 마지막이 자음일 때
                    temp.pop();
                    splitList.push(alpToHangul(temp));
                    temp = [lastAlp, alp];
                }
            }
        } else { // 현재 알파벳이 자음일 때
            if (temp.length === 1) {
                splitList.push(alpToHangul(temp));
                temp = [alp];
            } else {
                if (isVowelInHangul(lastAlp)) {
                    temp.push(alp);
                } else {
                    if (isSpecial(lastAlp, alp)) {
                        if (i < alps.length - 1 && isVowelInHangul(alps[i + 1])) {
                            splitList.push(alpToHangul(temp));
                            temp = [alp];
                        } else {
                            temp[temp.length - 1] = lastAlp + alp;
                            splitList.push(alpToHangul(temp));
                        }
                    } else {
                        splitList.push(alpToHangul(temp));
                        temp = [alp];
                    }
                }
            }
        }
    });

    if (temp.length) {
        splitList.push(alpToHangul(temp));
    }

    return splitList;
}

function isHangul(c: string): boolean {
    return start.includes(c) || middle.includes(c) || end.includes(c);
}

function onlyHangul(hangul: string[]): boolean {
    return hangul.every(h => isHangul(h));
}

function concatHangul(hangul: string[]): string {
    if (!onlyHangul(hangul)) {
        return hangul.join('');
    }
    if (hangul.length === 1) {
        return hangul[0];
    }
    if (hangul.length === 3) {
        return concatHangulWithBatchim(hangul);
    }
    return String.fromCharCode((start.indexOf(hangul[0]) * 588) + (middle.indexOf(hangul[1]) * 28) + 44032);
}

function concatHangulWithBatchim(hangul: string[]): string {
    return String.fromCharCode((start.indexOf(hangul[0]) * 588) + (middle.indexOf(hangul[1]) * 28) + (end.indexOf(hangul[2]) || 0) + 44032);
}

function typoFix(inputString: string): string {
    const hangulList = toHangulSplitList([...inputString]);
    const concat = hangulList.map(w => concatHangul(w));

    return concat.join('');
}
