export const buildSlug = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // eliminar diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // permitir únicamente letras, números, espacios y guiones
    .replace(/[\s\-]+/g, '-') // reemplazar espacios/guiones repetidos por uno solo
    .replace(/^-+|-+$/g, ''); // remover guiones al principio o al final

  return normalized.length > 0 ? normalized : null;
};
