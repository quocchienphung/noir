# Current Claude Code task: Sitewide Aithor motion remaster

Prompt mới nhất: **remaster animation trên toàn bộ trang public và mọi luồng navigation nội bộ của NOIR** theo Aithor. Bao gồm header, footer, logo, CTA, card/text links, page entrance, scroll reveal và tương tác trên thành phần hiện có. Giữ nguyên layout, grid, text, typography, assets và thiết kế. Lượt chuẩn bị này chỉ sửa tài liệu, chưa sửa application source.

Copy vào Claude Code tại root repository:

```text
Implement prompt/NOIR_SITEWIDE_AITHOR_MOTION_MASTER.md completely.
Read prompt/about-aithor/SOURCE_AND_REFERENCE_AUDIT.md and
prompt/references/aithor-about/reference-motion.json first.

This is a motion-only change to the existing NOIR website.
Use https://aithor.framer.website/about as the researched motion reference
and inspect the reference site's other pages to verify shared behavior.
This is SITEWIDE, not About-only or header-only.
Cover Home, Work, About, Contact, Privacy, 404 and every other public route.
All internal route links in the header, mobile drawer, footer, logo, CTAs,
cards and body copy must use consistent delayed opacity transitions.
Give each page appropriate entrance choreography, viewport reveals,
bounded stagger and polished interactions on its existing components.
A single global fade without page/section choreography is insufficient.
Preserve every existing NOIR layout, grid, text, font, spacing, color,
asset, breakpoint and section order. Do not redesign or clone Aithor.
Integrate existing Complexity, black hole, orbit, intro dive and Cards
Almanac motion without changing scene geometry, rendering or scroll ranges.
Remaster shared Services/Process/Principles reveals on Home and About;
avoid competing animation owners on the same node.

Respect current uncommitted changes and installed Next.js docs.
Capture the current working-tree visual/layout baseline before editing.
Implement robust App Router navigation, mobile drawer coordination,
focus/scroll restoration, reduced motion and cancellation.
Verify every route and navigation entry point, actual transition playback,
form/disclosure behavior, and unchanged settled layouts across breakpoints.
Run relevant checks and report evidence plus anything not verified.
Continue through implementation and QA; do not stop at a plan.
```

Master: [NOIR_SITEWIDE_AITHOR_MOTION_MASTER.md](NOIR_SITEWIDE_AITHOR_MOTION_MASTER.md). Prompt About cũ đã được thay bằng link dẫn tới bản toàn site này.

Audit: [source + reference](about-aithor/SOURCE_AND_REFERENCE_AUDIT.md). Thông số đã trích: [reference-motion.json](references/aithor-about/reference-motion.json).

---

# Previous task: Cards Almanac

Thay **wormhole và tesseract** bằng section Cards Almanac. Giữ hero black hole, orbit 360°, intro dive và Complexity. Đây là gói prompt để Claude triển khai; source giao diện chưa được thay trong lượt tạo prompt này.

Reference: https://www.getlayers.ai/sections?layer=cards-almanac

Copy đoạn sau vào Claude Code tại root repository:

```text
Implement prompt/CARDS_ALMANAC_REPLACEMENT_MASTER.md completely.
Read all linked layout, integration, QA and inspection documents first.
Inspect the local public-preview.mp4, contact sheet and full-size reference frames.

Replace the entire existing wormhole AND tesseract runtime with Cards Almanac
at the NoirTesseract position between NoirIntro and NoirCinematic.
Preserve the approved hero black hole, environment lensing, 360-degree orbit,
intro timing, Complexity scene and other routes. Preserve real NOIR copy and
migrate the demo slots into one typed card data config.

Recreate the actual scroll-driven overlapping card stack in HTML/CSS.
Do not use the preview video as runtime content. Do not substitute a static grid.
Distinguish observed reference details from proposed mobile/click behavior.
Respect current working-tree changes and installed Next.js documentation.

Complete implementation, browser comparison, accessibility and regression checks.
Report measured results and any checks that could not run. Do not claim 100%
fidelity or universal 60 fps without evidence. Continue until the required work
is implemented and verified; do not stop at a plan.
```

Master: [CARDS_ALMANAC_REPLACEMENT_MASTER.md](CARDS_ALMANAC_REPLACEMENT_MASTER.md)

Specs: [layout/motion](cards-almanac/01_LAYOUT_AND_MOTION.md), [content/integration](cards-almanac/02_CONTENT_AND_INTEGRATION.md), [QA](cards-almanac/03_QA.md).

Evidence: [inspection](../docs/research/cards-almanac/INSPECTION.md), [reference index](references/cards-almanac/REFERENCE_INDEX.md), [contact sheet](references/cards-almanac/contact-sheet.jpg).

Preview công khai đã được scan và tách 15 frame. Source/prompt Premium không truy cập được; thông số bố cục là ước lượng từ hình, còn hành vi dấu “+”, mobile và nhả stack cuối section được ghi rõ là đề xuất để tích hợp NOIR.
