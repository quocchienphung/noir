# Audit source NOIR và motion Aithor

Ngày kiểm tra: 2026-10-06. Đây là nghiên cứu để viết prompt; lượt này không triển khai animation vào application source.

**Phạm vi mới nhất đã được người dùng làm rõ:** mọi trang public và mọi luồng navigation nội bộ của NOIR, không giới hạn About/header. Specification hiện hành là [NOIR_SITEWIDE_AITHOR_MOTION_MASTER.md](../NOIR_SITEWIDE_AITHOR_MOTION_MASTER.md). Folder `about-aithor` chỉ giữ tên theo nguồn nghiên cứu ban đầu.

## Nguồn reference

- Page: https://aithor.framer.website/about
- Public main bundle: https://framerusercontent.com/sites/61lnrQyGJhTFJSboEC12aP/script_main.DFX1uv31.mjs
- Public About bundle: https://framerusercontent.com/sites/61lnrQyGJhTFJSboEC12aP/mRUyFUEd_m0Fymz4CLT2kjEg64b9CLoyAi1L217vMiQ.CYGj5zQt.mjs
- HTML `script[type="framer/appear"]#__framer__appearAnimationsContent`.

Bundle URLs có hash và có thể thay đổi khi publisher cập nhật. Không import chúng vào app; JSON cạnh prompt lưu các motion facts đã đọc để đối chiếu.

Đã mở page trong Chrome, xem giao diện settled, bấm header Home rồi About. Khi trở lại About, live DOM cho thấy các appear targets ở opacity 0.001, visual y 30 px, pills y 16 px; heading có word spans với blur 10 px và translateY 10 px. Đã đối chiếu HTML và bundle để lấy delay/duration/easing.

Giới hạn: không thu một trace frame-by-frame để xác minh overlap chính xác giữa route transition và child spring; chưa kiểm tra mobile Aithor. Cấu hình enter/exit được xác minh trong bundle, không đồng nghĩa đã đo thời gian wall-clock của navigation. Khi triển khai cần playback lại và đánh giá composition.

## Những gì source NOIR hiện có

| Khu vực | Hiện trạng / ảnh hưởng đến task |
| --- | --- |
| `package.json` | Next 16.3.0, React 19.2.4; CSS Modules; Playwright; không có motion library |
| `app/layout.tsx` | Server layout, local Albert Sans fonts, metadata NOIR; bọc route bằng NoirShell |
| `shell/NoirShell.tsx` | Skip link → fixed header → `#content` flex container → footer; chưa có transition coordinator |
| `shell/NoirHeader.tsx` | Client component, Link + usePathname; primaryNav Home/Work/About/Contact; desktop và mobile drawer |
| Header logic | Glass khi scrollY > 24; surface observer cho Cards Almanac sáng; focus trap/Escape/return-focus; lock root overflow khi mở menu |
| `header.module.css` | Header 350 ms glass transition; nav color 200 ms; drawer backdrop 400 ms; panel clip 500 ms; drawer links translate 600 ms và stagger; đây không phải page transition |
| `app/about/page.tsx` | PageHeader → Studio mark/prose/CTA → Process → Typical stack → Principles; server page có metadata |
| `pages.module.css` | twoCol đổi tại 1200 px, tỷ lệ .85fr/1.15fr; stackGrid 3 cột tại 810 px; markPanel aspect-ratio 1 và max-width 28rem |
| `sections.tsx` | PageHeader dùng chung inner routes; Process/Principles dùng cả Home và About |
| `sections.module.css` | `.reveal` đã chạy CSS view timeline, entry 0–70%, opacity + y 1.5rem; cần tránh double animation |
| `shell.module.css` | Dark tokens, gutter 1.25/2.5/4rem; header 4/4.5rem; breakpoint 810/1200; max-width 90rem |
| `app/page.tsx` | Intro → CardsAlmanac → Cinematic → Services → Process → Principles |
| `NoirCinematic.tsx` | “Complexity” trong screenshot là scroll-driven statement của homepage; DOM style opacity/transform được cập nhật theo cinematicTimeline |
| `useScrollTimeline.ts` | Progress từ layout thật, smoothing/resize/fonts/reduced-motion; phục hồi scroll quan trọng; không dùng cho navigation fade |
| `BlackHoleCanvas.tsx` | Renderer lifecycle, resize/visibility/offscreen; tránh duplicate page và ancestor scale gây đổi độ phân giải/render behavior |
| `app/projects/page.tsx` | PageHeader → experiments cards → capabilities list/note; có card links và inline Contact link ngoài header |
| `app/contact/page.tsx` | PageHeader → ContactForm và aside next steps; cần motion không reset state hoặc delay nhập liệu |
| `app/privacy-policy/page.tsx` | PageHeader → legal sections từ data privacy; ưu tiên khả năng đọc, không stagger từng từ |
| `app/not-found.tsx` | Mark → code → title → body → ButtonLink về Home; giữ not-found semantics |
| `shell/NoirFooter.tsx` | CTA Contact, footerNav gồm Privacy, brand row và Back to top; tất cả route links cần coordinator, Back to top vẫn là scroll action |

Đã đọc source trực tiếp ở các khu vực trên, kiểm tra intro/explore lifecycle bằng tìm kiếm liên quan, đọc route QA và các docs Next local về Link/router/template/pathname. Không tuyên bố đã audit từng dòng shader hoặc mọi test trong repo: chúng không cần thay để viết prompt motion này.

## Các quyết định tích hợp (không phải facts của Aithor)

1. Dùng fade route cho mọi link nội bộ chuyển route: header, drawer, footer, logo, CTA, card/text links, recovery link. Page/section choreography phủ mọi trang public.
2. Giữ fixed header ổn định và bỏ zoom toàn trang của Aithor để bảo vệ layout/sticky/WebGL.
3. Map visual reveal sang NoirMark đang có; không thêm hình hay pills.
4. Heading About là một từ, animate node nguyên vẹn; không cần split text.
5. Reveal dưới fold có nhịp dùng chung toàn site, khác nhau theo content role. Được remaster shared Services/Process/Principles trên Home và About; tránh chạy chồng CSS view timeline hiện có.
6. Chỉ nhận xét layout bất biến sau settle; pixel opacity/transform tạm thời thay đổi là chính animation được yêu cầu.

## Rủi ro cần khóa trong implementation prompt

- Root opacity nhân với child opacity có thể khiến delay cảm nhận dài hơn cấu hình; dùng chung mốc, kiểm tra playback.
- App Router `router.push` không phải awaitable route completion; template remount không tự cung cấp exit animation.
- Drawer có scroll lock và focus lifecycle sẵn; thêm coordinator thiếu phối hợp dễ để overflow hidden/focus sai.
- Global `.reveal` edit sẽ thay cả homepage: nay thuộc phạm vi được yêu cầu, nhưng cần migration owner animation có chủ đích và QA trên mọi caller.
- Root transform/overflow/contain mới có thể phá sticky scene; không giải quyết motion bằng thay layout container.
- Repo dirty rất lớn; có source modified/untracked và nhiều tài liệu đã xóa từ trước. So sánh baseline working tree, không restore/delete unrelated files.

## Tài liệu thiếu

`docs/research/INSPECTION_GUIDE.md` được AGENTS.md tham chiếu nhưng hiện không tồn tại. Không cần tạo lại nó cho task này.
