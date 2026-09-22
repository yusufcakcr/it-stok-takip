/** Uygulama genelinde paylaşılan sabitler. */

/** Sistemdeki en fazla kullanıcı sayısı (env ile artırılabilir). */
export const MAX_USERS = Number(process.env.MAX_USERS) > 0 ? Number(process.env.MAX_USERS) : 5

/** Parola için asgari uzunluk. */
export const MIN_PASSWORD_LENGTH = 8

/** Stok listelerinde varsayılan ve azami sayfa boyutu. */
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 500
