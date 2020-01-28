import { Token } from './token'
import { TokenType } from './tokentype'
import { CharUtils } from "./charUtils";
import { FSM } from "./FSM";

export class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.line = 0;
        this.column = 0;
    }

    /// Recognizes and returns a parenthesis token.
    recognizeParenthesis() {
        let position = this.position;
        let line = this.line;
        let column = this.column;
        let character = this.input.charAt(position);

        this.position += 1;
        this.column += 1;

        if (character === '(') {
            return new Token(TokenType.LeftParen, '(', line, column);
        }

        return new Token(TokenType.RightParen, ')', line, column);
    }

    /// Recognizes and returns an operator token.
    recognizeOperator() {
        let character = this.input.charAt(this.position);

        if (CharUtils.isComparisonOperator(character)) {
            return this.recognizeComparisonOperator();
        }

        if (CharUtils.isArithmeticOperator(operator)) {
            return this.recognizeArithmeticOperator();
        }

    }

    recognizeComparisonOperator() {
        let position = this.position;
        let line = this.line;
        let column = this.column;
        let character = this.input.charAt(position);

        // 'lookahead' is the next character in the input
        // or 'null' if 'character' was the last character.
        let lookahead = position + 1 < this.input.length ? this.input.charAt(position + 1) : null;

        // Whether the 'lookahead' character is the equal symbol '='.
        let isLookaheadEqualSymbol = lookahead !== null && lookahead === '=';

        this.position += 1;
        this.column += 1;

        if (isLookaheadEqualSymbol) {
            this.position += 1;
            this.column += 1;
        }

        switch (character) {
            case '>':
                return isLookaheadEqualSymbol
                    ? new Token(TokenType.GreaterThanOrEqual, '>=', line, column)
                    : new Token(TokenType.GreaterThan, '>', line, column);

            case '<':
                return isLookaheadEqualSymbol
                    ? new Token(TokenType.LessThanOrEqual, '<=', line, column)
                    : new Token(TokenType.LessThan, '<', line, column);

            case '=':
                return isLookaheadEqualSymbol
                    ? new Token(TokenType.Equal, '==', line, column)
                    : new Token(TokenType.Assign, '=', line, column);

            default:
                break;
        }

    }

    recognizeArithmeticOperator() {
        let position = this.position;
        let line = this.line;
        let column = this.column;
        let character = this.input.charAt(position);

        this.position += 1;
        this.column += 1;

        switch (character) {
            case '+':
                return new Token(TokenType.Plus, '+', line, column);

            case '-':
                return new Token(TokenType.Minus, '-', line, column);

            case '*':
                return new Token(TokenType.Times, '*', line, column);

            case '/':
                return new Token(TokenType.Div, '/', line, column);
        }
    }

    recognizeNewLine() {
        console.log('trying to recognizeNewLine');
        let position = this.position;
        let line = this.line;
        let column = this.column;

        this.position += 1;
        this.column += 1;
        return new Token(TokenType.Newline, '\n', line, column);
    }

    /// Recognizes and returns an identifier token.
    recognizeIdentifier() {
        console.log('in recognize identifier...');
        let identifier = '';
        let line = this.line;
        let column = this.column;
        let position = this.position;

        while (position < this.input.length) {
            let character = this.input.charAt(position);

            if (!(CharUtils.isLetter(character) || CharUtils.isDigit(character) || ['_', '-', '$'].includes(character))) {
                break;
            }

            identifier += character;
            position += 1;
        }

        console.log('at the end of the loop identifier is ', identifier);
        console.log('typeof identifier ', typeof identifier);

        this.position += identifier.length;
        this.column += identifier.length;

        if (identifier === 'true') {
            return new Token(TokenType.True, 'true', line, column);
        } else if (identifier === 'false') {
            return new Token(TokenType.False, 'false', line, column);
        } else if (identifier === 'class') {
            return new Token(TokenType.Class, 'class', line, column);
        } else if (identifier === 'func') {
            return new Token(TokenType.Func, 'func', line, column);
        } else if (identifier === 'else') {
            return new Token(TokenType.Else, 'else', line, column);
        }

        return new Token(TokenType.Identifier, identifier, line, column);
    }

    /// Recognizes and returns a number token.
    recognizeNumber() {
        console.log('trying to recognizeNumber');
        let line = this.line;
        let column = this.column;

        // We delegate the building of the FSM to a helper method.
        let fsm = this.buildNumberRecognizer();

        // The input to the FSM will be all the characters from
        // the current position to the rest of the lexer's input.
        let fsmInput = this.input.substring(this.position);
        console.log('fsmInput ', fsmInput);

        // Here, in addition of the FSM returning whether a number
        // has been recognized or not, it also returns the number
        // recognized in the 'number' variable. If no number has
        // been recognized, 'number' will be 'null'.
        let { isNumberRecognized, number, state } = fsm.run(fsmInput);
        console.log({ isNumberRecognized, number, state });

        if (isNumberRecognized) {
            console.log('inside isNumberRecognised');
            this.position += number.length;
            this.column += number.length;
            let tokenType;
            if (state === 2) {
                tokenType = TokenType.Integer;
            } else if (state === 4) {
                tokenType = TokenType.Decimal;
            }


            return new Token(tokenType, number, line, column);
        }
    }

    recognizeString() {
        let string = '"';
        let line = this.line;
        let column = this.column;
        let position = this.position + 1;

        while (position < this.input.length) {
            let character = this.input.charAt(position);

            if (character === '"') {
                string += character;
                break;
            }

            string += character;
            position += 1;
        }

        this.position += string.length;
        this.column += string.length;

        return new Token(TokenType.String, string, line, column);
    }

    buildNumberRecognizer() {
        // We name our states for readability.
        let State = {
            Initial: 1,
            Integer: 2,
            BeginNumberWithFractionalPart: 3,
            NumberWithFractionalPart: 4,
            BeginNumberWithExponent: 5,
            BeginNumberWithSignedExponent: 6,
            NumberWithExponent: 7,
            NoNextState: -1
        };

        let fsm = new FSM();
        fsm.states = new Set([State.Initial, State.Integer, State.BeginNumberWithFractionalPart, State.NumberWithFractionalPart,
        State.BeginNumberWithFractionalPart, State.BeginNumberWithExponent, State.BeginNumberWithSignedExponent,
        State.NumberWithExponent, State.NoNextState]);
        fsm.initialState = State.Initial;
        fsm.acceptingStates = new Set([State.Integer, State.NumberWithFractionalPart, State.NumberWithExponent]);
        fsm.nextState = (currentState, character) => {
            switch (currentState) {
                case State.Initial:
                    if (CharUtils.isDigit(character)) {
                        console.log('about to return State.integer');
                        return State.Integer;
                    }

                    if (character === '.') {
                        return State.BeginNumberWithFractionalPart;
                    }

                    break;

                case State.Integer:
                    if (CharUtils.isDigit(character)) {
                        return State.Integer;
                    }

                    if (character === '.') {
                        return State.BeginNumberWithFractionalPart;
                    }

                    if (character.toLowerCase() === 'e') {
                        return State.BeginNumberWithExponent;
                    }

                    break;

                case State.BeginNumberWithFractionalPart:
                    if (CharUtils.isDigit(character)) {
                        return State.NumberWithFractionalPart;
                    }

                    break;

                case State.NumberWithFractionalPart:
                    if (CharUtils.isDigit(character)) {
                        return State.NumberWithFractionalPart;
                    }

                    if (character.toLowerCase() === 'e') {
                        return State.BeginNumberWithExponent;
                    }

                    break;

                case State.BeginNumberWithExponent:
                    if (character === '+' || character === '-'){
                        return State.BeginNumberWithSignedExponent;
                    }

                    if (CharUtils.isDigit()) {
                        return State.NumberWithExponent;
                    }

                    break;

                case State.BeginNumberWithSignedExponent:
                    if (CharUtils.isDigit()) {
                        return State.NumberWithExponent;
                    }

                    break;

                default:
                    break;
            }

            return State.NoNextState;
        };

        return fsm;
    }

    /// Returns the next recognized 'Token' in the input.
    nextToken() {
        if (this.position >= this.input.length) {
            return new Token(TokenType.EndOfInput);
        }

        // We skip all the whitespaces and new lines in the input.
        // this.skipWhitespacesAndNewLines();

        let character = this.input.charAt(this.position);

        console.log('character is ', character);

        if (CharUtils.isNewLine(character)) {
            return this.recognizeNewLine();
        }

        if (CharUtils.isLetter(character)) {
            return this.recognizeIdentifier();
        }

        if (CharUtils.isBeginningOfNumber(character)) {
            return this.recognizeNumber();
        }

        if (CharUtils.isOperator(character)) {
            return this.recognizeOperator();
        }

        if (CharUtils.isParenthesis(character)) {
            return this.recognizeParenthesis();
        }

        if (character === '"') {
            return this.recognizeString();
        }

        // Throw an error if the current character does not match
        // any production rule of the lexical grammar.
        throw new Error('Unrecognized character ${character} at line ${this.line} and column ${this.column}.');
    }

    skipWhitespacesAndNewLines() {
        while (this.position < this.input.length && CharUtils.isWhitespaceOrNewLine(this.input.charAt(this.position))) {
            this.position += 1;

            if (CharUtils.isNewLine(this.input.charAt(this.position))) {
                this.line += 1;
                this.column = 0
            } else {
                this.column += 1;
            }
        }
    }

    allTokens() {
        let token = this.nextToken();
        let tokens = [];

        while (token.type !== TokenType.EndOfInput) {
            tokens.push(token);
            token = this.nextToken();
        }

        return tokens;
    }
}
