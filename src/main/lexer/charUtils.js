export class CharUtils {

	static isOperator(char) {
		return /[+\-*\/\^%=<>]/.test(char);
	}

	static isWhitespace(char) {
		return /\s/.test(char);
	}

	static isArithmeticOperator(char) {
		return /[+\-*\/\^%]/.test(char);
	}

	static isDigit(char) {
		console.log('in isDigit');
		return /[0-9]/.test(char);
	}

	static isLetter(char) {
		return /[a-zA-Z]/.test(char);
	}

	static isParenthesis(char) {
		return /[()]/.test(char);
	}

	static isWhitespaceOrNewLine(char) {
		return /\s\n/.test(char);
	}

	static isNewLine(char) {
		console.log('inside isnewLine');
		return /\n/.test(char);
	}

	static isComparisonOperator(char) {
		return /[<>=]/.test(char);
	}

	static isBeginningOfNumber(char) {
		return this.isDigit(char) || char === '.';
	}
}
