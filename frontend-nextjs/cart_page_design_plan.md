# UI Design Plan — Trang Giỏ Hàng (Cart Page)
## LearnHub · Course E-commerce Platform

---

## Mục tiêu

Thiết kế trang giỏ hàng khoá học với đầy đủ thông tin để học viên xem lại, chỉnh sửa và chuyển sang thanh toán. Phong cách kế thừa từ course detail page: **modern, clean, dark-capable**, primary = vàng cam `#E8A020`, accent = cam `#D07020`. Điểm đặc trưng của platform là tính năng **highlight video preview** trên mỗi khoá học trong giỏ hàng nhằm thúc đẩy quyết định mua.

---

## Tech Stack & Patterns (kế thừa codebase hiện tại)

| Concern | Solution |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Client state (cart) | Zustand với `persist` middleware → `localStorage` key `"cart-storage"` |
| Server state | TanStack React Query v5 (`createQueryHooks`, `createMutationHooks`) |
| HTTP client | Axios instance từ `@/lib/http` qua `createApi()` factory |
| UI components | Radix UI wrappers tại `/components/ui/` + Tailwind 4 |
| Animation | Framer Motion (nhất quán với Header) |
| Icons | Lucide React |
| Toast | Sonner |
| Form | React Hook Form + Zod (nếu cần validate coupon) |
| Query keys | `createKeyFactory("cart")` từ `@/lib/queryKeys` |
| Reuse utility | `formatPrice()` từ `@/features/courses/utils` |

> Pattern tham khảo chính:
> - Layout 2 cột: `features/courses/detail/index.tsx`
> - Sticky sidebar card: `features/courses/detail/components/CourseStickySidebar.tsx`
> - API factory pattern: `features/home/api/home.api.ts`
> - Query hook pattern: `features/home/api/home.hooks.ts`
> - Zustand store: `store/auth.ts`

---

## Design Tokens (kế thừa globals.css)

| Token | Giá trị (Light) | Dùng cho |
|---|---|---|
| Primary | `oklch(0.7664 0.1585 68)` ≈ `#E8A020` | CTA button, stars, badge giảm giá, icon |
| Accent | `oklch(0.6873 0.1646 54)` ≈ `#D07020` | Nút "Thanh toán ngay" (`bg-accent`) |
| Destructive | `oklch(0.6358 0.2088 25)` ≈ `#E24B4A` | Nút xoá, lỗi coupon |
| Success | `oklch(0.6873 0.1646 142.5)` ≈ `#3D9E50` | Badge đã lưu, coupon hợp lệ |
| Background | `oklch(1 0 0)` | Page BG |
| Card | `bg-card` + `border border-border/60` | Cart item, summary |
| Muted | `text-muted-foreground` | Secondary text |
| Font | Inter (via `--font-sans`) | Toàn bộ trang |

**Border radius**: `rounded-xl` (12px) cho card chính, `rounded-lg` (8px) cho button/input, `rounded-full` cho badge/pill
**Shadow**: `shadow-[0_4px_24px_rgba(0,0,0,0.08)]` cho sidebar, `shadow-[0_8px_32px_rgba(0,0,0,0.12)]` khi hover item

---

## Grid & Spacing

- **Container**: `container mx-auto max-w-7xl px-4 lg:px-8` (nhất quán với course detail)
- **Desktop layout**: 2 cột — `flex gap-8` — content `flex-1` | sidebar `w-96 shrink-0`
- **Mobile breakpoint**: `lg:` (1024px) — nhất quán với codebase hiện tại (không phải 768px)
- **Section spacing**: `space-y-6` hoặc `py-8`
- **Mobile**: Single column, sidebar inline phía dưới list, bottom bar fixed

---

## Cấu trúc Files

```
frontend-nextjs/
├── app/cart/
│   └── page.tsx                        # Route server component
├── features/cart/
│   ├── types.ts                        # CartItem, CartSummary, CouponResult
│   ├── utils.ts                        # calcDiscount, re-export formatPrice
│   ├── mock-data.ts                    # [MOCK] Dữ liệu giả lập
│   ├── index.tsx                       # CartPage — feature entry component
│   ├── components/
│   │   ├── CartItemCard.tsx            # Card 1 khoá học trong giỏ
│   │   ├── CartOrderSummary.tsx        # Sidebar: tổng tiền + checkout CTA
│   │   ├── CartCouponInput.tsx         # Input mã giảm giá
│   │   ├── CartEmptyState.tsx          # Empty state
│   │   └── CartMobileBottomBar.tsx     # Fixed bottom bar mobile
│   ├── hooks/
│   │   └── useCartStore.ts             # Zustand store — cart client state
│   └── api/
│       ├── cart.api.ts                 # API functions (createApi factory)
│       └── cart.hooks.ts              # React Query hooks (createQueryHooks)
└── components/
    └── Header.tsx                      # Thêm ShoppingCart icon + badge
```

---

## Cấu trúc trang (từ trên xuống dưới)

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER  [Logo]  [Nav]  [...]  [🛒 Icon + Badge số lượng]    │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐  ┌──────────────────────────┐
│  LEFT CONTENT  flex-1       │  │  SIDEBAR  w-96           │
│                             │  │  (sticky top-24)         │
│  1. Breadcrumb              │  │                          │
│  2. Page Title              │  │  Order Summary Card      │
│  3. Cart Item List          │  │  • Tổng phụ              │
│     └─ CartItemCard × N     │  │  • Coupon input          │
│  4. Saved For Later         │  │  • Giảm giá              │
│  5. "Tiếp tục mua sắm"      │  │  • Tổng cộng             │
│                             │  │  • CTA Thanh toán        │
│                             │  │  • Trust badges          │
└─────────────────────────────┘  └──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  MOBILE ONLY: Fixed bottom bar  [Tổng tiền]  [Thanh toán →] │
└──────────────────────────────────────────────────────────────┘
```

---

## Types (`features/cart/types.ts`)

```typescript
// CartItem: mapping từ DB schema
// Courses JOIN Cart JOIN Users JOIN Reviews (computed)
export interface CartItem {
  id: number;               // cart_items.id (PK)
  courseId: number;         // cart_items.course_id → Courses.id
  title: string;            // Courses.name
  instructorName: string;   // Users.first_name + Users.last_name (giảng viên)
  thumbnailUrl?: string;    // Courses.thumbnail_url (nếu có)
  level: "Beginner" | "Intermediate" | "Advanced";  // Courses.level
  durationSeconds: number;  // Courses.duration (seconds)
  price: number;            // Courses.price
  originalPrice?: number;   // Courses.original_price (nếu có)
  avgRating?: number;       // AVG(Reviews.rating) per course
  reviewCount?: number;     // COUNT(Reviews) per course
  savedForLater: boolean;   // cart_items.saved_for_later (cần confirm backend)
  // highlight video — từ highlight_feed JOIN Videos
  highlightVideoUrl?: string; // Videos.url WHERE type=HIGHLIGHT AND status=READY
  highlightTitle?: string;    // highlight_feed.title
}

export interface CartSummary {
  subtotal: number;         // SUM(Courses.price) for in-cart items
  discountAmount: number;   // từ coupon
  couponCode?: string;
  total: number;            // subtotal - discountAmount
  itemCount: number;        // COUNT of in-cart items (không tính saved)
}

export interface CouponResult {
  valid: boolean;
  discountAmount?: number;
  message?: string;         // "Mã không hợp lệ", "Đã hết hạn", v.v.
}
```

---

## [MOCK DATA] `features/cart/mock-data.ts`

> ⚠️ **Toàn bộ file này là mock, xoá khi backend sẵn sàng.**
> Đặt comment `// [MOCK]` ở đầu mỗi constant để dễ tìm kiếm.

```typescript
// [MOCK] Xoá file này khi cart API sẵn sàng.
// Để swap: thay MOCK_CART_ITEMS bằng data từ useCartQuery() trong index.tsx

import type { CartItem } from "./types";

export const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: 1,
    courseId: 101,
    title: "Lập trình Python từ cơ bản đến nâng cao",
    instructorName: "Nguyễn Văn A",
    thumbnailUrl: "https://placehold.co/400x225?text=Python",
    level: "Beginner",
    durationSeconds: 45000,   // 12h 30p
    price: 1_200_000,
    originalPrice: 2_000_000,
    avgRating: 4.8,
    reviewCount: 234,
    savedForLater: false,
    highlightVideoUrl: undefined,  // chưa có video
    highlightTitle: undefined,
  },
  {
    id: 2,
    courseId: 202,
    title: "Machine Learning với TensorFlow",
    instructorName: "Trần Thị B",
    thumbnailUrl: "https://placehold.co/400x225?text=ML",
    level: "Intermediate",
    durationSeconds: 64800,   // 18h
    price: 1_500_000,
    originalPrice: undefined,
    avgRating: 4.6,
    reviewCount: 187,
    savedForLater: false,
    highlightVideoUrl: undefined,
    highlightTitle: undefined,
  },
];
```

---

## Zustand Store (`features/cart/hooks/useCartStore.ts`)

> Pattern giống `store/auth.ts` — persist middleware, camelCase methods.
> Khi có backend: các thao tác `addItem/removeItem` sẽ gọi thêm mutation,
> store chỉ giữ vai trò optimistic update + cache count cho Header badge.

```typescript
// [MOCK NOTE] getItemCount() dùng items từ store (local).
// Khi backend sẵn sàng: lấy count từ GET /cart/summary thay vì tính local.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../features/cart/types";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;

  // Actions
  setItems: (items: CartItem[]) => void;
  removeItem: (courseId: number) => void;
  saveForLater: (courseId: number) => void;
  moveToCart: (courseId: number) => void;
  applyCoupon: (code: string, discount: number) => void;
  clearCoupon: () => void;
  clearCart: () => void;

  // Computed
  getInCartItems: () => CartItem[];
  getSavedItems: () => CartItem[];
  getItemCount: () => number;   // [MOCK] tính từ local — swap với API summary
  getSubtotal: () => number;    // [MOCK] tính từ local
  getTotal: () => number;
}

// persist key: "cart-storage"
// partialize: chỉ lưu items + couponCode (không lưu discountAmount — tính lại khi load)
```

---

## Chi tiết từng Section

---

### SECTION 1 — Header Cart Icon

**File**: `components/Header.tsx` (chỉnh sửa, thêm vào right side controls)

**Vị trí**: Bên phải, trước `ThemeToggle`, sau search button. Chỉ hiện khi `isAuthenticated`.

**Badge source**:
- **[MOCK]**: `useCartStore().getItemCount()` — lấy từ Zustand local store
- **[SWAP]**: `useCartSummary()` hook → `GET /cart/summary` → `{ total_items }` — dùng React Query với `staleTime: 30_000`

**Badge behaviour**:
```
count = 0       → Ẩn badge (không render span)
count 1-99      → Hiện số
count > 99      → Hiện "99+"
```

**Tailwind spec badge** (nhất quán với codebase):
```tsx
<span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center
  justify-center rounded-full bg-destructive px-1 text-[10px] font-bold
  text-white leading-none">
  {count > 99 ? "99+" : count}
</span>
```

**Interactivity**: Click → `/cart`. Nếu `count = 0` → vẫn đến `/cart` (hiển thị empty state).

---

### SECTION 2 — Breadcrumb + Page Title

```tsx
// Dùng Breadcrumb component từ /components/ui/breadcrumb (Radix)
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Trang chủ</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Giỏ hàng</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

<h1 className="text-2xl font-bold mt-4">Giỏ hàng của bạn</h1>
<p className="text-sm text-muted-foreground mt-1">{itemCount} khoá học</p>
```

---

### SECTION 3 — CartItemCard

**File**: `features/cart/components/CartItemCard.tsx`

**Layout card** (pattern từ CourseStickySidebar):
```tsx
<div className="flex gap-4 rounded-xl border border-border/60 bg-card p-4
  shadow-sm transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">

  {/* Thumbnail — 140px desktop, 100px mobile */}
  <div className="relative w-[140px] shrink-0 lg:w-[140px] sm:w-[100px]
    aspect-video rounded-lg overflow-hidden bg-muted">
    ...
  </div>

  {/* Content */}
  <div className="flex flex-1 flex-col gap-1 min-w-0">
    <h3 className="line-clamp-2 text-[15px] font-bold leading-snug">
    <p className="text-xs text-muted-foreground">
      {instructorName} · {level} · {formatDuration(durationSeconds)}
    </p>
    {/* Rating row */}
    {/* Price row */}

    {/* Action row */}
    <div className="mt-auto flex items-center gap-3 border-t border-border/40 pt-3 text-xs">
      <button className="text-primary hover:underline">Lưu để sau</button>
      <span className="text-border">·</span>
      <button className="text-destructive hover:underline">Xoá</button>
    </div>
  </div>
</div>
```

**Highlight Video Preview** (thumbnail hover):
```tsx
// [MOCK] highlightVideoUrl = undefined → chỉ hiện static thumbnail
// [SWAP] khi backend có: CartItem.highlightVideoUrl được populate từ
//        GET /cart → include highlight_feed JOIN Videos
//
// Logic:
// - Nếu highlightVideoUrl === undefined → chỉ render <img>
// - Nếu có → render cả <img> và <video preload="none">,
//   dùng onMouseEnter để play, onMouseLeave để pause + reset

<div
  className="group relative w-full h-full"
  onMouseEnter={() => videoRef.current?.play()}
  onMouseLeave={() => { videoRef.current?.pause(); videoRef.current!.currentTime = 0; }}
>
  <img src={thumbnailUrl} className="... group-hover:opacity-0 transition-opacity duration-300" />
  {highlightVideoUrl && (
    <video
      ref={videoRef}
      src={highlightVideoUrl}
      muted
      loop
      playsInline
      preload="none"                 // ← lazy load, không tải khi render
      className="absolute inset-0 h-full w-full object-cover opacity-0
        group-hover:opacity-100 transition-opacity duration-300"
    />
  )}
  {/* Play icon overlay — ẩn khi hover có video */}
  <div className="absolute inset-0 flex items-center justify-center
    group-hover:opacity-0 transition-opacity">
    <Play className="h-8 w-8 text-white/80" />
  </div>
  {/* "Xem thử" badge — chỉ hiện khi có video và đang hover */}
  {highlightVideoUrl && (
    <span className="absolute top-2 left-2 hidden group-hover:block
      rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-bold text-white">
      Xem thử
    </span>
  )}
</div>
```

**Price area**:
```tsx
// Reuse formatPrice() từ @/features/courses/utils
import { formatPrice } from "@/features/courses/utils";

<div className="flex items-baseline gap-2">
  <span className="text-[17px] font-extrabold">{formatPrice(price)}</span>
  {originalPrice && (
    <span className="text-sm text-muted-foreground line-through">
      {formatPrice(originalPrice)}
    </span>
  )}
  {originalPrice && (
    <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
      −{Math.round((1 - price / originalPrice) * 100)}%
    </span>
  )}
</div>
```

**Xoá item**:
- Click "Xoá" → hiện AlertDialog confirm nhỏ (dùng `AlertDialog` từ Radix `/components/ui/alert-dialog`)
- Confirm → `cartStore.removeItem(courseId)` + gọi `removeFromCartMutation.mutate(courseId)`
- Animation: `animate-out slide-out-to-left-5 fade-out duration-300` trước khi remove khỏi DOM

---

### SECTION 4 — CartOrderSummary (Sidebar)

**File**: `features/cart/components/CartOrderSummary.tsx`

**Position**: `sticky top-24` — nhất quán với `CourseStickySidebar`

**Dữ liệu**:
- **[MOCK]**: Tính `subtotal` từ `useCartStore().getSubtotal()`
- **[SWAP]**: Lấy từ React Query `useCartSummary()` → `GET /cart/summary`

```tsx
// Pattern card giống CourseStickySidebar
<div className="rounded-xl border border-border/60 bg-card
  shadow-[0_8px_40px_rgba(0,0,0,0.13)] p-6 space-y-4">

  <h2 className="text-base font-bold">Tóm tắt đơn hàng</h2>

  {/* Price rows */}
  <div className="space-y-2.5 text-sm">
    <div className="flex justify-between">
      <span className="text-muted-foreground">Tổng phụ ({itemCount} khoá)</span>
      <span>{formatPrice(subtotal)}</span>
    </div>
    {discountAmount > 0 && (
      <div className="flex justify-between text-green-600 dark:text-green-400">
        <span>Giảm giá (coupon)</span>
        <span>−{formatPrice(discountAmount)}</span>
      </div>
    )}
  </div>

  <Separator />

  <div className="flex justify-between text-[17px] font-extrabold">
    <span>Tổng cộng</span>
    <span>{formatPrice(total)}</span>
  </div>

  {/* Coupon */}
  <CartCouponInput />

  {/* CTA */}
  <Button size="lg" className="w-full bg-accent text-accent-foreground
    shadow-md shadow-accent/25 hover:bg-accent/90">
    Thanh toán ngay ({itemCount} khoá học)
  </Button>

  {/* "Tiếp tục mua sắm" */}
  <Button variant="ghost" className="w-full text-sm" asChild>
    <Link href="/courses">Tiếp tục mua sắm</Link>
  </Button>

  {/* Trust */}
  <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
    <Lock className="h-3 w-3" />
    Đảm bảo hoàn tiền 30 ngày
  </p>
</div>
```

---

### SECTION 5 — CartCouponInput

**File**: `features/cart/components/CartCouponInput.tsx`

> ⚠️ **Backend chưa có bảng Coupons.** Nếu chưa có trong sprint này → prop `disabled` ẩn component.
> Để toggle: `const COUPON_ENABLED = false;` ở đầu `CartOrderSummary.tsx`.

**States**: `idle` | `loading` | `success` | `error`

```tsx
// [MOCK] applyCoupon luôn trả về error (chưa có backend)
// [SWAP] thay bằng mutation: POST /cart/apply-coupon { code }
//        Response: { valid: boolean, discount_amount?: number, message?: string }

// Khi success → cartStore.applyCoupon(code, discountAmount)
// Khi error → hiện toast.error(message) qua Sonner
```

**UI spec**:
```tsx
<div className="flex gap-2">
  <Input
    placeholder="Nhập mã giảm giá..."
    className="h-10 flex-1 focus-visible:ring-primary"
    value={code}
    onChange={(e) => setCode(e.target.value)}
  />
  <Button
    size="sm"
    className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
    onClick={handleApply}
    disabled={isLoading || !code}
  >
    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
  </Button>
</div>

{/* Success state */}
{status === "success" && (
  <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
    <CheckCircle className="h-3 w-3" />
    Đã áp dụng: {appliedCode}
  </p>
)}

{/* Error state */}
{status === "error" && (
  <p className="text-xs text-destructive">{errorMessage}</p>
)}
```

---

### SECTION 6 — Saved For Later

**Điều kiện render**: `savedItems.length > 0`

**[MOCK]**: `savedItems` lấy từ `useCartStore().getSavedItems()` (local only)
**[SWAP]**: Backend cần field `cart_items.saved_for_later: boolean` hoặc `status ENUM('in_cart', 'saved')`. Confirm trước khi implement.

CartItemCard ở chế độ compact (saved state):
- Không có nút "Lưu để sau"
- Có nút "Thêm vào giỏ hàng" (màu primary) + "Xoá"
- Height thấp hơn một chút

---

### SECTION 7 — CartEmptyState

**File**: `features/cart/components/CartEmptyState.tsx`

**Điều kiện**: `inCartItems.length === 0`

```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <ShoppingCart className="h-20 w-20 text-muted-foreground/30 mb-6" />
  <h2 className="text-xl font-bold mb-2">Giỏ hàng của bạn đang trống</h2>
  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
    Hãy thêm khoá học bạn muốn học vào đây
  </p>
  <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/5" asChild>
    <Link href="/courses">Khám phá khoá học</Link>
  </Button>
</div>

{/* Gợi ý khoá học — reuse CourseCard từ features/home/component/CourseCard.tsx */}
{/* [MOCK] dùng MOCK_FEATURED_COURSES từ features/home/data/mock_data.ts */}
{/* [SWAP] dùng useFeaturedCourses() hook đã có sẵn */}
<section className="mt-12">
  <h3 className="text-base font-semibold mb-4 text-center">Có thể bạn quan tâm</h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {featuredCourses?.slice(0, 3).map((course) => (
      <CourseCard key={course.id} course={course} />
    ))}
  </div>
</section>
```

---

### SECTION 8 — CartMobileBottomBar

**File**: `features/cart/components/CartMobileBottomBar.tsx`

**Pattern giống `courses/detail/index.tsx:166`**:
```tsx
// Chỉ render khi inCartItems.length > 0
<div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3
  border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
  <span className="text-base font-bold text-foreground">
    {formatPrice(total)}
  </span>
  <Button
    size="lg"
    className="flex-1 bg-accent text-accent-foreground shadow-md shadow-accent/25
      hover:bg-accent/90"
  >
    Thanh toán ngay
  </Button>
</div>
```

---

## CartPage Entry (`features/cart/index.tsx`)

```tsx
"use client";

// [MOCK] Swap checklist — tìm comment [MOCK] để biết chỗ cần thay:
// 1. Thay MOCK_CART_ITEMS bằng data từ useCartQuery() (React Query)
// 2. Thay useCartStore() actions bằng mutations (removeFromCart, saveForLater)
// 3. Thay useFeaturedCourses() mock bằng API thực (đã sẵn sàng)
// 4. Thay getItemCount() bằng data từ useCartSummary()

import { useState } from "react";
import { MOCK_CART_ITEMS } from "./mock-data"; // [MOCK]
import { useCartStore } from "./hooks/useCartStore";
// ... các import khác

export default function CartPage() {
  // [MOCK] Khởi tạo từ mock data — xoá khi có API
  const [items, setItems] = useState(MOCK_CART_ITEMS);

  // Thực ra sẽ dùng:
  // const { data: items, isLoading } = useCartQuery();

  const inCartItems = items.filter(i => !i.savedForLater);
  const savedItems = items.filter(i => i.savedForLater);

  if (inCartItems.length === 0) return <CartEmptyState />;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {/* Breadcrumb + Title */}

        <div className="flex gap-8">
          {/* Left: item list */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile: summary inline */}
            <div className="lg:hidden">
              <CartOrderSummary items={inCartItems} />
            </div>

            {inCartItems.map(item => (
              <CartItemCard key={item.id} item={item} onRemove={...} onSave={...} />
            ))}

            {savedItems.length > 0 && <SavedForLaterSection items={savedItems} />}
          </div>

          {/* Right: sticky sidebar (desktop) */}
          <div className="hidden w-96 shrink-0 lg:block">
            <div className="sticky top-24">
              <CartOrderSummary items={inCartItems} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <CartMobileBottomBar items={inCartItems} />
    </div>
  );
}
```

---

## API Layer (`features/cart/api/`)

### `cart.api.ts` — pattern giống `home.api.ts`

```typescript
/**
 * Cart API
 *
 * [MOCK] Tất cả functions hiện tại return mock data.
 * Để swap sang real API:
 * 1. Uncomment phần apiHttpClient call
 * 2. Xoá return mock data
 * 3. Thêm mapper function nếu field names khác
 *
 * Endpoints dự kiến:
 *   GET    /cart                   → CartItem[] (include highlight_feed)
 *   GET    /cart/summary           → { total_items, total_price }
 *   DELETE /cart/:course_id        → { success }
 *   PATCH  /cart/:course_id/save   → { saved: boolean }
 *   POST   /cart/apply-coupon      → CouponResult
 */

import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import type { CartItem, CartSummary, CouponResult } from "../types";
import { MOCK_CART_ITEMS } from "../mock-data"; // [MOCK] — xoá khi có API

// ─── Backend response mapper (uncomment khi có API) ───────────────────────────
// type CartItemApiResponse = {
//   id: number;
//   course_id: number;
//   course_name: string;
//   instructor_name: string;
//   thumbnail_url?: string;
//   level: string;
//   duration: number;
//   price: number;
//   original_price?: number;
//   avg_rating?: number;
//   review_count?: number;
//   saved_for_later: boolean;
//   highlight_video_url?: string;
//   highlight_title?: string;
// };
//
// function mapCartItem(raw: CartItemApiResponse): CartItem {
//   return {
//     id: raw.id,
//     courseId: raw.course_id,
//     title: raw.course_name,
//     instructorName: raw.instructor_name,
//     thumbnailUrl: raw.thumbnail_url,
//     level: raw.level as CartItem["level"],
//     durationSeconds: raw.duration,
//     price: raw.price,
//     originalPrice: raw.original_price,
//     avgRating: raw.avg_rating,
//     reviewCount: raw.review_count,
//     savedForLater: raw.saved_for_later,
//     highlightVideoUrl: raw.highlight_video_url,
//     highlightTitle: raw.highlight_title,
//   };
// }
// ─────────────────────────────────────────────────────────────────────────────

export const cartApi = createApi({
  getCart: async (): Promise<CartItem[]> => {
    // [MOCK] Xoá 2 dòng dưới, uncomment real call khi có API
    return MOCK_CART_ITEMS;
    // const { data } = await apiHttpClient.get<CartItemApiResponse[]>("/cart");
    // return data.map(mapCartItem);
  },

  getCartSummary: async (): Promise<{ total_items: number; total_price: number }> => {
    // [MOCK]
    const inCart = MOCK_CART_ITEMS.filter(i => !i.savedForLater);
    return {
      total_items: inCart.length,
      total_price: inCart.reduce((sum, i) => sum + i.price, 0),
    };
    // [SWAP] const { data } = await apiHttpClient.get("/cart/summary");
    // return data;
  },

  removeFromCart: async (courseId: number): Promise<void> => {
    // [MOCK] no-op
    // [SWAP] await apiHttpClient.delete(`/cart/${courseId}`);
  },

  saveForLater: async (courseId: number, saved: boolean): Promise<void> => {
    // [MOCK] no-op
    // [SWAP] await apiHttpClient.patch(`/cart/${courseId}/save`, { saved });
  },

  applyCoupon: async (code: string): Promise<CouponResult> => {
    // [MOCK] luôn trả về lỗi (chưa có bảng Coupons)
    return { valid: false, message: "Tính năng coupon chưa khả dụng." };
    // [SWAP] const { data } = await apiHttpClient.post("/cart/apply-coupon", { code });
    // return data;
  },
});
```

### `cart.hooks.ts` — pattern giống `home.hooks.ts`

```typescript
import { createQueryHooks, createMutationHooks } from "@/features/_shared/react-query-factories";
import { cartApi } from "./cart.api";

// Query: danh sách cart items
export const cartHooks = createQueryHooks(
  "cart",
  ["items"],
  cartApi.getCart,
  { staleTime: 30_000 },   // 30s
);

export const cartKeys = cartHooks.keys;
export const useCartQuery = cartHooks.useQuery;

// Query: summary cho header badge
export const cartSummaryHooks = createQueryHooks(
  "cart",
  ["summary"],
  cartApi.getCartSummary,
  { staleTime: 30_000 },
);
export const useCartSummary = cartSummaryHooks.useQuery;

// Mutations
export const useRemoveFromCart = createMutationHooks(
  "cart",
  "remove",
  cartApi.removeFromCart,
  {
    onSuccess: (_data, _vars, queryClient) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.root });
    },
  },
);

export const useApplyCoupon = createMutationHooks(
  "cart",
  "apply-coupon",
  cartApi.applyCoupon,
);
```

---

## Skeleton Loading

Khi `isLoading = true` từ `useCartQuery()`:

```tsx
// [MOCK] Hiện tại không cần (data load ngay từ mock)
// [SWAP] Wrap CartPage với: if (isLoading) return <CartSkeleton />

function CartItemSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-border/60 bg-card p-4 animate-pulse">
      <div className="w-[140px] aspect-video rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted ml-auto" />
      </div>
    </div>
  );
}
// Render 2-3 lần trong CartPage khi loading
```

---

## States & Edge Cases

| State | Xử lý |
|---|---|
| Giỏ trống | Render `<CartEmptyState />` thay toàn bộ layout |
| Chưa đăng nhập | `ProtectedRoute` redirect `/signin?returnUrl=/cart` |
| Course bị xoá | `[SWAP]` Backend filter ra, hiển thị card "Khoá học không còn khả dụng" |
| Video highlight đang xử lý | `highlightVideoUrl = undefined` → fallback static thumbnail, không báo lỗi |
| Mạng chậm | Skeleton loading (`CartItemSkeleton`) |
| Coupon hết hạn | Toast error + giữ input, clear `appliedCoupon` |
| Coupon feature off | `const COUPON_ENABLED = false` trong `CartOrderSummary.tsx` → ẩn `CartCouponInput` |

---

## DB Fields Mapping (theo ERD)

| UI Field | DB Source | Ghi chú |
|---|---|---|
| `title` | `Courses.name` | |
| `instructorName` | `Users.first_name + last_name` | WHERE `Users.role = LECTURER` |
| `thumbnailUrl` | `Courses.thumbnail_url` | nullable |
| `level` | `Courses.level` | ENUM |
| `durationSeconds` | `Courses.duration` | seconds |
| `price` | `Courses.price` | |
| `originalPrice` | `Courses.original_price` | nullable |
| `avgRating` | `AVG(Reviews.rating)` | computed |
| `reviewCount` | `COUNT(Reviews.id)` | computed |
| `savedForLater` | `cart_items.saved_for_later` | ⚠️ cần confirm backend có field này |
| `highlightVideoUrl` | `Videos.url` | WHERE `Videos.type=HIGHLIGHT AND status=READY` via `highlight_feed` |
| `highlightTitle` | `highlight_feed.title` | nullable |

> **Cart table**: cần xác nhận schema — dự kiến `cart_items(id, user_id, course_id, saved_for_later, added_at)`

---

## API Endpoints Dự Kiến

```
GET    /cart                          → CartItem[] (join Courses, Users, Reviews, highlight_feed, Videos)
GET    /cart/summary                  → { total_items, total_price }  ← cho header badge
DELETE /cart/:course_id               → { success }
PATCH  /cart/:course_id/save          → { saved: boolean }           ← toggle saved_for_later
POST   /cart/apply-coupon             → CouponResult                 ← khi có bảng Coupons
```

---

## Badge Styles (Tailwind)

| Badge | Class |
|---|---|
| Level: Beginner | `bg-primary/10 text-primary border border-primary/30 rounded-full px-2 py-0.5 text-[11px]` |
| Level: Intermediate | `bg-accent/10 text-accent border border-accent/30 ...` |
| Level: Advanced | `bg-destructive/10 text-destructive border border-destructive/30 ...` |
| Giảm X% | `rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white` |
| Xem thử | `rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-bold text-white` |
| Coupon OK | `bg-green-500/10 text-green-600 border border-green-500/30 ...` |

---

## Thứ tự Implement

1. `features/cart/types.ts`
2. `features/cart/mock-data.ts`
3. `features/cart/hooks/useCartStore.ts` — Zustand store
4. `features/cart/api/cart.api.ts` — API với mock
5. `features/cart/api/cart.hooks.ts` — React Query hooks
6. `features/cart/components/CartEmptyState.tsx`
7. `features/cart/components/CartItemCard.tsx`
8. `features/cart/components/CartCouponInput.tsx`
9. `features/cart/components/CartOrderSummary.tsx`
10. `features/cart/components/CartMobileBottomBar.tsx`
11. `features/cart/index.tsx` — compose all
12. `app/cart/page.tsx` — route page
13. `components/Header.tsx` — thêm cart icon + badge

---

## Checklist Trước Khi Implement

- [ ] Confirm schema `cart_items` — có field `saved_for_later` chưa?
- [ ] Confirm Coupon feature có trong sprint này không (nếu không → `COUPON_ENABLED = false`)
- [ ] Confirm API `/highlight-feed/preview` đã có chưa (nếu chưa → `highlightVideoUrl = undefined` mọi item)
- [ ] Confirm redirect sau "Thanh toán ngay" → `/checkout` hay modal?
- [ ] Confirm payment providers cần hiển thị logo (VISA, Mastercard, Momo, VNPay?)

---

## Verification

1. `http://localhost:3000/cart` → trang render đúng với mock data
2. Desktop ≥1024px: 2 cột, sidebar sticky khi scroll
3. Mobile <1024px: single column + bottom bar fixed
4. Empty state: xoá tất cả items → hiện empty state + gợi ý
5. Hover thumbnail: video play nếu `highlightVideoUrl` có giá trị
6. Xoá item: confirm dialog → item slide-out → badge header giảm
7. Dark mode toggle: layout + màu sắc đúng
8. `npx tsc --noEmit` không lỗi
