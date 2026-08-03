/**
 * Portuguese translations — mirrors the file layout of `../en/`.
 * This is a partial translation: missing keys fall back to English.
 */
import type { TranslationSchema } from '../en'
import type { DeepPartial } from '../../types'
import admin from './admin'
import auth from './auth'
import common from './common'
import landing from './landing'
import publicArea from './public'

const pt = {
  common,
  auth,
  landing,
  public: publicArea,
  admin,
} satisfies DeepPartial<TranslationSchema>

export default pt
