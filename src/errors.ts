export class MethodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MethodError';
  }
}
