import { randomInt } from 'crypto';

const VALUES = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateCode(prefix: string, length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) code += VALUES[randomInt(VALUES.length)];
  return `${prefix}-${code}`;
}

export const generateBookingRequestCode = () => generateCode('GR');

export const generateBookingCode = () => generateCode('GB');
