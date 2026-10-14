import bcyrpt from 'bcrypt';

export class BcryptService {
  constructor() {}

  async genHash(value: string, saltRounds: number) {
    return await bcyrpt.hash(value, saltRounds);
  }

  async compare(value: string, hash: string) {
    return await bcyrpt.compare(value, hash);
  }
}
