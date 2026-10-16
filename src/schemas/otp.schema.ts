import z from 'zod';

export enum EOtpChannel {
  EMAIL = 'email',
  PHONE = 'phone',
}

export const SignInContext = z
  .object({
    type: z.literal('sign-in'),
    email: z.string().nullable().default(null),
    phone: z.string().nullable().default(null),
  })
  .refine((data) => !!data.email?.trim() || !!data.phone?.trim(), {
    message: 'Either email or phone must be provided',
  });

export const SignUpContext = z.object({
  type: z.literal('sign-up'),
  name: z.string(),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
});

export const ChallengeContext = z.discriminatedUnion('type', [
  SignInContext,
  SignUpContext,
]);
export type TChallengeContext = z.infer<typeof ChallengeContext>;

export const CreateChallenge = z.object({
  channel: z.enum(EOtpChannel),
  destination: z.string(),
  context: ChallengeContext,
});

export type TCreateChallenge = z.infer<typeof CreateChallenge>;

export const Challenge = CreateChallenge.extend({
  otpHash: z.string(),
});

export type TChallenge = z.infer<typeof Challenge>;

export const CreateChallengeResponse = z.object({
  challengeId: z.string(),
  expiresIn: z.number(),
  resendAfter: z.number(),
});

export type TCreateChallengeResponse = z.infer<typeof CreateChallengeResponse>;
