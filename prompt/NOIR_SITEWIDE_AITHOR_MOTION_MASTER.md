# Claude Code task — Remaster animation toàn bộ NOIR theo Aithor

## 1. Mục tiêu và ranh giới bắt buộc

Hãy triển khai animation cho website NOIR hiện tại, tham khảo duy nhất **cách chuyển động** tại https://aithor.framer.website/about.

Yêu cầu đã được làm rõ: **mọi luồng navigation và mọi trang public của NOIR đều cần animation được chăm chút như Aithor, không giới hạn About hoặc header.** Hãy xây dựng một hệ motion nhất quán cho route transition, page entrance, reveal khi cuộn và tương tác trên các thành phần hiện có. About là nguồn tham khảo đã nghiên cứu, không phải giới hạn triển khai.

Phạm vi bắt buộc: Home `/`, Work `/projects`, About `/about`, Contact `/contact`, Privacy `/privacy-policy`, `/404` và unknown-route not-found; header desktop/mobile, logo, footer navigation, CTA, `ButtonLink`, card/text links và mọi link nội bộ chuyển route thực sự. Mọi route public khác phát hiện trong source cũng phải được kiểm kê và tích hợp phù hợp. Route `/qa/*` phục vụ kỹ thuật không cần choreography trình diễn.

Không được coi việc thêm một fade toàn trang là hoàn thành: mỗi loại trang phải có nhịp nội dung phù hợp, các section/item xuất hiện có thứ tự, tương tác phản hồi mềm, và cùng một destination phải nhất quán dù đến từ header, footer hay CTA.

**Đây là task motion-only. KHÔNG clone/rebuild/redesign website Aithor.**

- Giữ nguyên toàn bộ layout, grid, text, font, màu, spacing, kích thước, responsive breakpoint, assets, thứ tự section và đường dẫn hiện tại của NOIR.
- Không đổi About thành bố cục tượng Hy Lạp, không thêm card/team/mission/testimonial, không lấy text, ảnh, font, icon, nền trắng hoặc branding Aithor.
- Không sửa câu chữ, không thêm line break, không chia lại paragraph, không thu nhỏ font để animation trông giống reference.
- Ảnh người dùng cung cấp là cảnh **Complexity / Event Horizon trên homepage NOIR**, không phải section cần chuyển vào About. Homepage vẫn nằm trong phạm vi remaster motion. Giữ scene, layout, nội dung, renderer và cơ chế scroll/orbit hiện có; phối hợp motion mới với animation sẵn có, không thay cảnh bằng hiệu ứng reveal generic.
- Khi animation kết thúc, giao diện phải khớp baseline NOIR trước khi sửa. Thay đổi chỉ được nhìn thấy trong chuyển động.
- Không dừng ở kế hoạch: triển khai, kiểm tra bằng browser, sửa lỗi và báo kết quả có bằng chứng.

Đọc [SOURCE_AND_REFERENCE_AUDIT.md](about-aithor/SOURCE_AND_REFERENCE_AUDIT.md) và [reference-motion.json](references/aithor-about/reference-motion.json) trước khi code. Phân biệt rõ thông số trích từ Aithor và quyết định tích hợp vào NOIR.

## 2. Đọc source và tài liệu đúng phiên bản

Đọc `AGENTS.md`. Repo đang có nhiều thay đổi chưa commit, cả modified, deleted và untracked; dùng **working tree hiện tại** làm baseline. Không reset/clean/checkout đè file; không khôi phục tài liệu đã bị người dùng xóa. Đừng coi `git diff HEAD` là riêng phần việc của mình.

Đọc ít nhất:

- `package.json`
- Tất cả route public trong `src/app/`, gồm layout, Home, Projects, About, Contact, Privacy, 404 và not-found
- `src/components/noir/shell/NoirShell.tsx`, `NoirHeader.tsx`, `NoirFooter.tsx`
- `src/components/noir/sections.tsx`
- `src/styles/noir/{shell,header,footer,pages,sections,form}.module.css`
- `src/components/noir/ContactForm.tsx`, `AlmanacDetails.tsx` và mọi component chứa link/action liên quan
- `src/app/globals.css`, `src/data/noir/site.ts`
- `src/components/noir/{NoirIntro,NoirCinematic,NoirCardsAlmanac,BlackHoleCanvas}.tsx` và `src/components/noir/useScrollTimeline.ts`
- Các test route, scroll, explore lifecycle và Cards Almanac liên quan.

Trước khi viết code, đọc docs cài trong `node_modules/next/dist/docs/`, nhất là:

- `01-app/01-getting-started/04-linking-and-navigating.md`
- `01-app/03-api-reference/02-components/link.md` — `onNavigate`, `prefetch`, `scroll`
- `01-app/03-api-reference/04-functions/use-router.md`
- `01-app/03-api-reference/04-functions/use-pathname.md`
- `01-app/03-api-reference/03-file-conventions/template.md`

Hiện cài Next 16.3.0, React 19.2.4, TypeScript strict; có CSS Modules và Playwright, chưa có Motion/Framer Motion/GSAP. Không dùng Pages Router `router.events`. Không giả định `router.push()` trả Promise chờ route render xong. Không bật experimental View Transitions hoặc thêm dependency lớn chỉ để fade.

File `docs/research/INSPECTION_GUIDE.md` được AGENTS tham chiếu nhưng không tồn tại ở thời điểm audit. Nếu vẫn thiếu, ghi nhận và tiếp tục bằng source/docs thật, không tự bịa nội dung file.

## 3. Thông số Aithor đã xác minh

Đây là **cấu hình source công khai**, không phải phép đo frame-by-frame trên mọi thiết bị.

### Chuyển route

| Phase | Cấu hình Aithor |
| --- | --- |
| Outgoing | opacity về 0, duration 600 ms, delay 0, tween, easing `[0.4, 0, 0.24, 1]` |
| Incoming | opacity từ 0 về 1, duration 600 ms, delay 300 ms, tween, easing `[0.68, 0, 0.33, 1]` |
| Scale reference | outgoing về 0.95; incoming từ 1.1 về 1 |

**Quyết định tích hợp NOIR:** lấy opacity, easing và nhịp delay. Bỏ scale toàn trang. Không transform `html`, `body`, `.shell`, `#content` hay ancestor chứa sticky/fixed/WebGL. Scale reference là thông tin nghiên cứu, không phải yêu cầu phải sao chép. Không thêm slide toàn trang, curtain, wipe, flash hoặc loader.

### About entrance

| Thành phần reference | Initial → final | Delay | Duration/config |
| --- | --- | --- | --- |
| Eyebrow | opacity 0.001 → 1, không translate | 300 ms | spring, bounce 0, duration 1500 ms |
| Heading | opacity 0.001 → 1, blur 10 px → 0, y 10 px → 0 | startDelay 500 ms | word tokenization, transition.delay 50 ms, duration 1500 ms, spring bounce 0, repeat false, onMount |
| Lead paragraph | opacity 0.001 → 1, không translate | 900 ms | spring bounce 0, duration 1500 ms |
| Buttons | opacity 0.001 → 1, không translate | 1000 ms | spring bounce 0, duration 1500 ms |
| Visual chính | opacity 0.001 → 1, y 30 px → 0 | 400 ms | spring bounce 0, duration 1500 ms |
| Floating pills | opacity 0.001 → 1, y 16 px → 0 | 1100/1200/1300 ms | spring bounce 0, duration 1500 ms |

Không tạo floating pills trong NOIR. Không nhầm `transition.delay: 0.05` của text effect với phép đo stagger đã xác minh của từng word: cần kiểm tra lại playback/runtime trước khi mô tả chính xác. Heading About chỉ có một từ, animate nguyên node. Với heading dài ở trang khác, chỉ split theo từ nếu bảo toàn text, whitespace, line wrapping, semantic heading và accessible name; nếu có sai khác geometry thì animate nguyên block. Không tách từng ký tự hoặc tạo thêm chữ.

Thông số chi tiết trên được trích từ About và global route config của Aithor, chưa phải audit mọi trang Aithor. Trước implementation, xem thêm Home và các trang tương ứng qua navigation thực tế của reference để kiểm chứng nhịp dùng chung. Ghi rõ observed/configured/adapted; không gán số đo About cho mọi trang như thể đã đo hết. Không có bản sao tương ứng cho một trang NOIR vẫn phải áp cùng motion language một cách phù hợp.

Spring duration không đồng nghĩa với CSS `ease` cùng duration. Ưu tiên CSS/WAAPI nhẹ; nếu dùng cubic-bezier hoặc keyframe để xấp xỉ spring không nảy, ghi rõ đó là approximation và so sánh playback. Không tuyên bố giống 100% chỉ vì điền đúng milliseconds.

## 4. Motion coverage cho tất cả trang và thành phần

Tạo bảng inventory trước khi code: route/component → trigger → target hiện có → effect → delay/duration → replay policy → motion đang sở hữu node → cách kiểm chứng. Không bỏ qua trang ít được truy cập hoặc entry từ footer.

### 4.1. Quy tắc chung

- Page entrance: eyebrow → heading → lead → actions/visual theo vai trò, không áp cùng delay cho tất cả node và không bắt mọi thứ bay lên đồng loạt.
- Dùng các giá trị Aithor ở mục 3 làm mốc, điều chỉnh composition khi page không có đủ nhóm. Không tạo section/visual/CTA mới để lấp vai trò bị thiếu.
- Các item cùng nhóm được stagger có giới hạn. Không nhân delay với index toàn bộ trang khiến item cuối chờ nhiều giây; reset nhịp theo section/nhóm, cho nội dung đang được keyboard truy cập hiện ngay.
- Nội dung trên fold chạy theo route-ready; nội dung dưới fold chạy theo viewport entry. Direct load và navigation đều có entrance; hover, re-render form, mở accordion hoặc resize không restart page entrance.
- Back/Forward khôi phục vị trí cuộn và nội dung đã đọc: không ẩn lại nguyên trang ở vị trí restore để bắt xem intro từ đầu. Có thể reveal ngắn vùng đang thấy nếu không làm gián đoạn restoration.
- Chỉ một cơ chế sở hữu opacity/transform của mỗi target. Page transition và child entrance phải được phối hợp theo một clock; opacity nhân đôi và stagger lồng nhau cần kiểm tra bằng playback.

### 4.2. Bản đồ từng route

| Route | Motion bắt buộc trên cấu trúc hiện có | Điều phải giữ |
| --- | --- | --- |
| `/` Home | Route entry/exit; hòa nhập với intro đang có; reveal Services, Process, Principles và footer; CTA/nav phản hồi nhất quán | Black hole, orbit, intro dive, Cards Almanac và Complexity tiếp tục animation chuyên biệt; không đổi track height/pin range/camera/geometry, không chồng reveal lên canvas hoặc chữ đang do timeline điều khiển |
| `/projects` Work | PageHeader stagger; experiment cards xuất hiện theo nhóm; metadata/title/body/actions có hierarchy; capabilities/list/note reveal khi vào viewport | Grid cards, twoCol, text, tags, links và thứ tự item giữ nguyên; không morph grid thành carousel |
| `/about` About | PageHeader; mark/prose/CTA; Process; stack groups; Principles | Giữ nguyên bố cục About; chi tiết mapping ở mục 4.3 |
| `/contact` Contact | PageHeader; form và aside hiện có được reveal theo nhóm; feedback focus/validation/status mềm | Không delay nhập liệu, không reset field/state khi animate, không đổi validation/submit behavior hoặc giả vờ gửi thành công |
| `/privacy-policy` Privacy | Header entrance và từng legal section fade nhẹ khi vào viewport | Ưu tiên đọc nhanh; không split/stagger từng từ của legal paragraphs, không đổi text/ngày cập nhật |
| `/404` và unknown route | Mark/code/title/body/CTA xuất hiện có thứ tự; Back to home tham gia transition | Giữ HTTP/not-found semantics, route recovery và layout căn giữa |
| Shared header/footer | Navigation transition ở mọi entry point; drawer choreography; footer pitch/brand/nav reveal có nhịp | Giữ geometry, sticky/fixed behavior, focus, hit area và accessible labels |

Với Home, “giữ scene” không có nghĩa miễn animation cho cả trang. Scene đã có motion được tích hợp như một phần hệ thống; nội dung tĩnh xung quanh phải được polish. Nếu node đã do cinematic/intro/card timeline điều khiển, giữ owner đó và điều phối từ route boundary; không gắn một observer khác viết đè style.

### 4.3. About cụ thể

Giữ đúng DOM flow và thứ tự sau:

1. `PageHeader`: eyebrow **Studio**, H1 **About**, lead từ `about.lead`.
2. Section Studio: `twoCol`, `markPanel` chứa `NoirMark`, `prose` và hai CTA hiện có.
3. `NoirProcess`.
4. Typical stack: heading, `stackGrid` ba nhóm, note hiện có.
5. `NoirPrinciples`.
6. Footer chung như hiện tại.

Áp dụng:

- Eyebrow, H1, lead nhận nhịp xuất hiện tương ứng trong bảng trên.
- `NoirMark` là visual hiện có có thể nhận opacity + translateY nhỏ; không thay kích thước, border, nền hay vị trí markPanel.
- Prose và CTA hiện nhẹ theo nhóm. Không gắn chữ vào cùng timeline với scene Complexity.
- Phần dưới fold dùng viewport reveal nhẹ, một lần mỗi lần vào route; đề xuất tích hợp: opacity 0 → 1, y 12–16 px → 0, duration 650–850 ms, stagger giữa item 70–100 ms. Đây là adaptation cho NOIR, không phải thông số đã đo của mọi section Aithor.
- Chỉ bắt đầu reveal section khi sắp vào viewport; không chạy hết lúc mount khi section chưa thấy. Item đã reveal giữ trạng thái visible khi cuộn ngược trong cùng lượt vào trang.
- Giữ nguyên line wrapping. Ưu tiên animate node hiện có; đừng thêm wrapper làm thay đổi grid child, margin collapsing hoặc selector `.section + .section`.
- Không animate width, height, padding, margin, gap, font-size, grid-template-columns, position hoặc display. Transform cục bộ chỉ được thay đổi vị trí thị giác tạm thời.
- Chỉ blur H1 nếu playback phù hợp; không blur paragraph dài hoặc canvas. Kết thúc phải `filter: none`, `transform: none`, opacity 1, không lưu blur/transform promotion vĩnh viễn.

**Xung đột cần xử lý:** `sections.module.css` đã có `.reveal` dùng CSS `animation-timeline: view()` với y 1.5rem. `NoirProcess` và `NoirPrinciples` được dùng ở homepage và About. Được remaster reveal của các section dùng chung trên cả hai trang; migration phải có chủ đích, loại bỏ/disable owner cũ cho các target đã chuyển sang hệ mới. Không để CSS view timeline và WAAPI/CSS entrance cùng ghi opacity/transform trên một node. Không đổi layout CSS để xử lý xung đột.

### 4.4. Tương tác nhỏ và trạng thái

- Link/button/card CTA: hover, focus-visible, press và mouse-leave có easing nhất quán. Chỉ animate decoration/icon/opacity hoặc dịch cục bộ rất nhỏ; không đổi hit area, border thickness làm layout shift, label hoặc navigation destination.
- Không bắt keyboard focus đợi hover animation. Giữ focus ring rõ; không dùng opacity thấp cho text đang cần đọc.
- Drawer: giữ cấu trúc, tinh chỉnh opacity/stagger/easing nếu cần; focus trap, Escape và scroll lock vẫn đúng.
- Services disclosure và details/modal có sẵn: polish phản hồi mở/đóng nếu phù hợp, giữ semantic/state/dimensions ở hai trạng thái gốc. Không tạo accordion/modal mới. Ưu tiên fade nội dung bên trong; tránh animation height hoặc kỹ thuật làm thay đổi flow ngoài hành vi mở/đóng vốn có.
- Form: focus/validation/status transition nhẹ, tôn trọng live announcement; không fade form lại mỗi keystroke hoặc submit. Không thay data handling.
- Footer: reveal nhóm pitch, CTA, nav, brand vừa đủ; không làm người dùng chờ mới bấm được link. Back to top giữ chức năng scroll hiện tại, không chạy route transition.
- Không thêm custom cursor, magnetic button, parallax, bounce mạnh, scroll hijacking, sound, loader hoặc looping decoration không có trong NOIR chỉ để chứng minh có animation.

## 5. Điều phối navigation — phải thật sự hoạt động

Tạo một cơ chế nhỏ, dễ kiểm tra, có phase rõ ràng, ví dụ `idle → exiting → awaiting-commit → entering → idle`.

- Trigger: **mọi link nội bộ thực sự chuyển route public**, từ header desktop/mobile, logo, footer, CTA, ButtonLink, experiment card/text links, inline links, 404 recovery. Dùng abstraction chung và kiểm kê tất cả caller; không chỉ thay Link trong header. Không intercept mù mọi anchor hoặc action button.
- Giữ semantic `<Link href>`/anchor, prefetch và keyboard activation. Ưu tiên `onNavigate` nếu phù hợp docs cài đặt. Ctrl/Cmd-click, Shift-click, middle-click, new tab, download, external, mailto, tel và hash-only phải giữ behavior chuẩn.
- Click hợp lệ phải có phản hồi fade ngay; **không `setTimeout` đứng yên 300–1000 ms rồi mới bắt đầu animation**.
- Fade outgoing 600 ms với easing đã xác minh; chỉ commit điều hướng sau outgoing hoàn tất nếu chọn mô hình tuần tự. Dùng animation completion + cancellation, không dựa duy nhất timer đoán thời điểm render.
- Prefetch giữ được lợi ích trong thời gian exit. Khi route đã commit, đặt scroll/focus đúng rồi mới reveal destination. Enter 600 ms, delay 300 ms tính từ incoming sẵn sàng.
- Bộ đếm entrance của mọi page dùng chung mốc route-ready với incoming. Không đợi enter kết thúc rồi cộng thêm toàn bộ 300/500/900/1000 ms lần nữa. Tránh chuỗi delay khiến người dùng nhìn màn hình trống lâu không cần thiết.
- Với route lạnh/chậm/lỗi: transition phải phục hồi khả năng đọc và tương tác; không treo lớp che, opacity 0, `inert` hoặc scroll lock vô hạn. Timeout là fail-safe, không phải cơ chế điều phối chính. Không push lặp để chữa lỗi.
- Chọn rõ chính sách rapid click: hủy request chưa commit để theo đích mới nhất, hoặc khóa ngắn và giữ một đích; xử lý nhất quán, không xếp hàng mọi click. Same-route click không fade lại rồi treo vì pathname không đổi.
- Back/Forward, direct load mọi route, reload, hash navigation, route lỗi/404 và reduced motion phải ổn. Không ép scroll về đầu trên Back/Forward; bảo toàn restoration. Không giả định mọi lần pathname đổi đều đến từ header. Cùng-path khác query phải được phân loại đúng; chờ chỉ pathname thay đổi sẽ treo nếu điều hướng chỉ đổi query.
- Route đi vào mới không có hash cần top phù hợp, nhất là click About khi đang cuộn tới Complexity. Không cuộn outgoing về đầu trước khi fade-out, gây flash hero.
- Header, wordmark, active indicator và drawer giữ geometry/style cũ. Header ở ngoài vùng nội dung bị fade; `aria-current` theo pathname đã commit, không báo About active khi nội dung vẫn ở route cũ.
- Footer không được lóe đột ngột vào vùng nhìn khi route ngắn thay route dài. Phối hợp footer reveal với route fade, tránh opacity/stagger bị nhân đôi; giữ layout và không remount shared shell chỉ để restart footer.
- Không duplicate hai live route chứa canvas để crossfade. Không giữ stale React Server Component tree bằng hack internal router, không dùng private Next contexts để freeze router.
- `template.tsx` đơn thuần chỉ giải quyết remount/entry, không chứng minh outgoing exit hoạt động. Không coi `<AnimatePresence>` bọc `children` là lời giải mặc định cho App Router.

### Mobile drawer và accessibility

Header hiện có focus trap, Escape, return-focus, `inert` và lock `documentElement.style.overflow`. Tích hợp phải phối hợp với chúng:

- Click bất kỳ route trong drawer: đóng drawer một lần, giải phóng lock đúng lúc, chuyển route một lần; không cộng nối tiếp toàn bộ drawer 500 ms + exit 600 ms + entry delay + item delay một cách máy móc.
- Không để effect return-focus của drawer giành focus lại sau khi route mới đã sẵn sàng.
- Focus sau điều hướng bàn phím đến vùng content/heading phù hợp, dùng `preventScroll` khi cần. Skip link `#content` phải giữ nguyên.
- Không để CTA trong suốt nhận focus/click. Có thể reveal tức thì khi focus đi vào hoặc quản lý `inert` theo nhóm trong thời gian ẩn; đừng làm keyboard phải chờ hết một timeline dài.
- `prefers-reduced-motion: reduce`: bỏ delay, blur, translate và choreography; nội dung hiển thị ngay, navigation vẫn hoạt động. Nếu media preference đổi giữa animation, hoàn tất/cancel an toàn và cleanup.
- Progressive enhancement: JavaScript tắt/lỗi không khiến nội dung bất kỳ trang nào bị opacity 0 mãi. SSR và hydration không được flash visible → hidden → visible.
- Cleanup timer, RAF, observer, animation, listener khi unmount/cancel. `will-change` chỉ trong thời gian cần thiết.

## 6. Kiến trúc và phạm vi file

Ưu tiên motion primitives dùng chung: transition provider, internal transition link, page entrance, section reveal và stagger group; tên file tự chọn theo codebase. Timing/easing tập trung trong một cấu hình có type, không mỗi page một bộ setTimeout. Client boundary nhỏ; pages giữ server component và metadata khi có thể. Tránh route allowlist chỉ chứa `/about`; tránh abstraction khiến mọi trang chỉ có một fade generic.

Những chỗ có thể cần thay đổi:

- `NoirShell.tsx`: đặt provider/layer cho navigation, giữ skip link/header/content/footer và flow.
- `NoirHeader.tsx`: nối handler điều hướng; giữ logic surface/scrolled/mobile.
- Tất cả public page files: gắn choreography theo vai trò, giữ nguyên nội dung và cấu trúc section.
- `sections.tsx`: tích hợp PageHeader, ButtonLink, Services, Process, Principles vào motion dùng chung; audit tác động trên mọi caller.
- `NoirFooter.tsx`, `ContactForm.tsx`, link/card/detail components: nối transition hoặc interaction motion đúng phạm vi, giữ state và chức năng.
- File CSS/motion mới; CSS hiện có chỉ thêm hook/scoped override phục vụ animation.
- Test motion/navigation có ý nghĩa và tài liệu kết quả.

Không sửa copy trong `site.ts` hoặc data cards, assets, fonts, visual tokens, `globals.css` layout/visual rules, shaders, renderer, camera/scenes hoặc thuật toán scroll timeline để làm task này. Có thể thêm hook/data attribute/coordination tối thiểu tại component scene nếu cần để hòa nhập navigation; không rewrite scene hoặc đổi pin range, track height, camera, orbit physics. Bảo vệ file dữ liệu/rendering bằng hash, còn component tích hợp được review diff để xác nhận chỉ đổi motion orchestration. Không dùng quy tắc protected cũ để bỏ qua animation của Home hoặc shared sections.

Repo dùng CSS Modules thật, không migrate style sang hệ khác chỉ vì scaffold nói Tailwind. TypeScript strict, không `any`, không hardcode class hash do CSS Modules sinh ra. Không import code bundle Framer vào runtime NOIR. Nếu thêm dependency, giải thích vì sao CSS/WAAPI không đủ và ghi chi phí; mặc định không cần.

## 7. Quy trình kiểm chứng bắt buộc

### Baseline trước khi sửa

- Ghi lại trạng thái working tree và hash các protected file hiện tại.
- Chụp mọi route public, header/drawer/footer desktop/mobile, homepage ở hero/Cards Almanac/Complexity khi đã settle. Capture cùng viewport/scroll/font readiness ở trước và sau.
- Ghi textContent, heading order, link href, section order, bounding box và computed layout cho PageHeader/twoCol/stackGrid/Process/Principles, Work cards, Contact form/aside, Privacy sections và 404.
- Dùng viewport 1440×900, 1280×800, 810×900, 809×900, 390×844, 320×844; kiểm tra thêm ranh 1199/1200 cho twoCol/Process.

### Motion QA

Record hoặc lấy chuỗi frame của reference Home → About và các trang tương ứng có thể truy cập, cùng chuỗi local đi qua tất cả route; không dùng một screenshot cuối để kết luận motion đúng. Lấy mốc click, exit start/end, route commit, enter start/end, H1/lead start và settled. So sánh motion language và nhịp, không so layout NOIR với layout Aithor.

Test tối thiểu:

1. Home top → About qua header; Home tại Complexity → About.
2. Chuỗi Home → Work → About → Contact → Privacy → Home; vào `/404` và unknown route, dùng recovery CTA về Home. Mọi public route phải có evidence entry/reveal.
3. Mobile Menu → từng route; Escape, Tab/Shift+Tab và resize sang desktop.
4. Direct load và reload từng route, Back/Forward có scroll restoration.
5. Rapid clicks, same-route click, modifier/middle-click, keyboard Enter.
6. Route chưa prefetch/chậm, lỗi navigation nếu mô phỏng được; không màn hình trống vĩnh viễn.
7. Reduced motion, JS-disabled fallback, focus trong reveal, không hidden-focusable.
8. Cuộn mỗi trang xuống/up: không double animation, không nháy hoặc restart liên tục; footer reveal và links hoạt động ở mọi route.
9. Header, footer, logo, ButtonLink, Work card CTA, inline Contact link và 404 CTA đều đi qua coordinator; cùng destination không có đường đi instant ngoài ý muốn.
10. Form nhập liệu/validation/status không reset hoặc đổi chức năng; accordion/details giữ state/focus; Back to top/hash-only không bị route fade.

Chạy `npm run check`. Khởi động production server theo port phù hợp rồi chạy ít nhất:

```sh
node tests/qa-routes.mjs http://localhost:<PORT>
```

Đọc CLI của `qa-scroll`, `qa-explore-lifecycle`, `qa-cards-almanac` trước khi chạy; thực hiện regression phù hợp vì shell chung bao quanh homepage. Không giả định mọi script dùng cùng cú pháp hoặc port. Chạy kiểm tra browser bổ sung cho navigation animation nếu test hiện có chỉ load route trực tiếp.

### Tiêu chí pass

- Cảm giác delay + opacity mềm có thật ở mọi luồng chuyển route hợp lệ; không chỉ header, About hoặc hover trên chữ nav. Mọi route có page entrance và section choreography thích hợp, không bỏ trắng phần dưới fold.
- Final layout và copy giống baseline: không thay grid/gutter/height/font/line break/section order. Bounding box sau settle sai lệch tối đa 1 CSS px do rounding; bất kỳ khác biệt vượt mức phải điều tra, không sửa baseline để che lỗi.
- Không horizontal overflow hoặc CLS do animation; không white flash, flicker, blur sót lại, duplicate WebGL context, scroll jump, ghost CTA, stale overlay hoặc focus trap.
- Homepage vẫn đúng hero, orbit, Cards Almanac và Complexity; shared Services/Process/Principles được remaster có chủ đích, không xung đột với các scene có timeline riêng.
- Các file protected không thay đổi so với baseline đầu task; không claim clean `git diff` khi repo vốn đã dirty.
- Báo rõ PASS/FAIL/NOT RUN, viewport, browser, production/dev, và giới hạn phép đo. Không tuyên bố universal 60fps hoặc 100% fidelity nếu chưa đo.

## 8. Kết quả cần bàn giao

Code đã triển khai và kiểm chứng, danh sách file thay đổi của riêng task, bảng motion constants thực tế, ảnh before/after settled cho từng route, bằng chứng navigation đang chạy, coverage matrix route × entry point × motion type, kết quả test và hạn chế còn lại. Nêu rõ các phần giữ nguyên của NOIR đã được kiểm tra bằng gì. Không tự deploy/commit unrelated changes.

Ưu tiên cuối cùng: **Toàn bộ NOIR được chăm chút animation như Aithor; toàn bộ layout và thiết kế NOIR giữ nguyên. Không thu hẹp task trở lại About.**
