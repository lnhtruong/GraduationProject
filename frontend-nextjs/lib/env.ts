const isProduction = process.env.NODE_ENV === "production";

function normalizeUrl(value = "") {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    return new URL(trimmedValue).toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

const vercelSiteUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOptionalBoundedNumber(
  value: string | undefined,
  min: number,
  max: number,
) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function formatPercent(value: number) {
  return `${Number.isInteger(value) ? value : Number(value.toFixed(2))}%`;
}

function formatMegabytes(value: number) {
  if (value >= 1024 && value % 1024 === 0) {
    return `${value / 1024}GB`;
  }
  if (value >= 1024) {
    return `${Number((value / 1024).toFixed(1))}GB`;
  }
  return `${value}MB`;
}

export const API_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
export const SITE_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (vercelSiteUrl ? `https://${vercelSiteUrl}` : "") ||
    (isProduction ? "" : "http://localhost:3000"),
);
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export const CLOUDINARY_MAX_UPLOAD_MB = parsePositiveNumber(
  process.env.NEXT_PUBLIC_CLOUDINARY_MAX_UPLOAD_MB,
  100,
);
export const BUNNY_MAX_UPLOAD_MB = parsePositiveNumber(
  process.env.NEXT_PUBLIC_BUNNY_MAX_UPLOAD_MB,
  4096,
);
export const CLOUDINARY_MAX_UPLOAD_BYTES =
  CLOUDINARY_MAX_UPLOAD_MB * 1024 * 1024;
export const BUNNY_MAX_UPLOAD_BYTES = BUNNY_MAX_UPLOAD_MB * 1024 * 1024;
export const CLOUDINARY_MAX_UPLOAD_LABEL = formatMegabytes(
  CLOUDINARY_MAX_UPLOAD_MB,
);
export const BUNNY_MAX_UPLOAD_LABEL = formatMegabytes(BUNNY_MAX_UPLOAD_MB);
export const PLATFORM_FEE_PERCENT = parseOptionalBoundedNumber(
  process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT,
  0,
  100,
);
export const PLATFORM_FEE_PERCENT_LABEL =
  PLATFORM_FEE_PERCENT === null ? "N%" : formatPercent(PLATFORM_FEE_PERCENT);

export const INSTRUCTOR_PIT_WITHHOLDING_PERCENT = parseOptionalBoundedNumber(
  process.env.NEXT_PUBLIC_INSTRUCTOR_PIT_WITHHOLDING_PERCENT,
  0,
  100,
) ?? 2;
export const INSTRUCTOR_VAT_WITHHOLDING_PERCENT = parseOptionalBoundedNumber(
  process.env.NEXT_PUBLIC_INSTRUCTOR_VAT_WITHHOLDING_PERCENT,
  0,
  100,
) ?? 5;
export const INSTRUCTOR_TAX_EXEMPT_ANNUAL_REVENUE_VND = parsePositiveNumber(
  process.env.NEXT_PUBLIC_INSTRUCTOR_TAX_EXEMPT_ANNUAL_REVENUE_VND,
  1_000_000_000,
);
export const INSTRUCTOR_TAX_PERCENT =
  INSTRUCTOR_PIT_WITHHOLDING_PERCENT + INSTRUCTOR_VAT_WITHHOLDING_PERCENT;
export const INSTRUCTOR_TAX_PERCENT_LABEL = formatPercent(INSTRUCTOR_TAX_PERCENT);
export const INSTRUCTOR_TAX_BASE_MODE =
  process.env.NEXT_PUBLIC_INSTRUCTOR_TAX_BASE_MODE === "after_platform_fee"
    ? "after_platform_fee"
    : "gross";
