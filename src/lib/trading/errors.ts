// Trade-flow errors. Catchable so the store / UI can map them to the
// beginner-friendly messages from PRD §30.5.

export class TradeValidationError extends Error {
  code:
    | 'INVALID_QUANTITY'
    | 'INSUFFICIENT_CASH'
    | 'NOT_OWNED'
    | 'EXCEEDS_OWNED'
    | 'NO_QUOTE'
    | 'UNSUPPORTED_CURRENCY'
    | 'BEFORE_FIRST_PURCHASE';
  constructor(
    code: TradeValidationError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'TradeValidationError';
    this.code = code;
  }
}
