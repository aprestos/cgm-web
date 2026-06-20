import { compactVerify, importSPKI } from 'jose'
import type { JWTPayload } from 'jose'

type SPKIKey = Awaited<ReturnType<typeof importSPKI>>

let _publicKey: SPKIKey | null = null

async function getPublicKey(): Promise<SPKIKey> {
  if (_publicKey) return _publicKey
  const b64 = import.meta.env.VITE_TICKETS_PUBLIC_KEY as string
  const pem = `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----`
  _publicKey = await importSPKI(pem, 'EdDSA')
  return _publicKey
}

export async function verifyTicketQR(rawValue: string): Promise<JWTPayload> {
  const key = await getPublicKey()
  const { payload: rawPayload } = await compactVerify(rawValue, key)
  const payload = JSON.parse(new TextDecoder().decode(rawPayload)) as JWTPayload

  if (payload.exp !== undefined && payload.exp < Date.now() / 1000) {
    throw new Error('Ticket has expired')
  }

  return payload
}
